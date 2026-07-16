##
## Talkup Project, 2026
## TalkUp.AI
## File description:
## Speech-to-Speech processing module queue service for managing incoming audio requests and processing them sequentially.
##

from __future__ import annotations
from dataclasses import dataclass
from .enumMcs import EnumMcs
from .models import STSModels
from .pipeline import STSResult, process_sts_request
from .notifications import Notifications

import asyncio


NOTIFIER = Notifications()

@dataclass
class StsJob:
	"""
	A job representing a speech-to-speech processing request.
	"""
	audio_bytes: bytes
	result_future: asyncio.Future[STSResult]
	interview_id: str | None = None

class StsQueueService:
	"""
	Service for managing a queue of speech-to-speech processing jobs.
	It runs a worker that processes incoming audio requests sequentially and returns results through futures.
	"""
	def __init__(self, models: STSModels, maxsize: int):
		"""
		Initializes the StsQueueService with the given models and queue maximum size.
		"""
		self._models = models
		self._queue: asyncio.Queue[StsJob | None] = asyncio.Queue(maxsize=maxsize)
		self._worker_task: asyncio.Task | None = None

	@property
	def queue(self) -> asyncio.Queue[StsJob | None]:
		"""
		Returns the queue of speech-to-speech processing jobs.
		"""
		return self._queue

	def start(self) -> None:
		"""
		Starts the worker task that processes the queue of jobs.
		"""
		if self._worker_task is None or self._worker_task.done():
			self._worker_task = asyncio.create_task(self._worker())

	async def stop(self) -> None:
		"""
		Stops the worker task gracefully by sending a sentinel value to the queue and waiting for the worker to finish.
		"""
		if self._worker_task is None:
			return

		await self._queue.put(None)
		await self._worker_task
		self._worker_task = None

	async def submit(
		self,
		audio_bytes: bytes,
		interview_id: str | None = None,
	) -> STSResult:
		"""
		Submits an audio request for processing and returns the result.
		"""
		loop = asyncio.get_running_loop()
		result_future: asyncio.Future[STSResult] = loop.create_future()

		await self._queue.put(
			StsJob(
				audio_bytes=audio_bytes,
				result_future=result_future,
				interview_id=interview_id,
			),
		)
		return await result_future

	async def _worker(self) -> None:
		"""
		Worker function that processes jobs from the queue.
		"""
		NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 0, "STS queue worker started")

		while True:
			job = await self._queue.get()
			if job is None:
				self._queue.task_done()
				NOTIFIER.send_notification(EnumMcs.MicroservicesNames.STS, 1, "STS queue worker stopping")
				break

			try:
				result = await asyncio.to_thread(
					process_sts_request,
					self._models,
					job.audio_bytes,
					job.interview_id,
				)
				if not job.result_future.done():
					job.result_future.set_result(result)
			except Exception as err:
				if not job.result_future.done():
					job.result_future.set_exception(err)
			finally:
				self._queue.task_done()
