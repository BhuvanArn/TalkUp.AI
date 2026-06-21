##
## Talkup Project, 2025
## TalkUp.AI
## File description:
## Handles notifications for the TalkUp AI microservices.
##

from __future__ import annotations

import re

from . import enumMcs

ANSI_RESET = "\033[0m"
ANSI_BOLD = "\033[1m"
ANSI_RED = "\033[31m"
ANSI_GREEN = "\033[32m"
ANSI_YELLOW = "\033[33m"
ANSI_CYAN = "\033[36m"

class Notifications():
    def __init__(self, use_color: bool = True):
        """
        Class constructor.
        """
        self.use_color = use_color

    def _wrap(self, text: str, color: str) -> str:
        """
        Wraps the given text with the specified ANSI color codes if color is enabled.
        """
        if not self.use_color:
            return text
        return f"{color}{text}{ANSI_RESET}"

    def _highlight_message(self, msg: str) -> str:
        """
        Highlights specific keywords in the message with colors based on their significance.
        """
        if not self.use_color:
            return msg

        highlights = (
            ("ACTIVE", ANSI_GREEN),
            ("SUCCESS", ANSI_GREEN),
            ("STARTED SUCCESSFULLY", ANSI_GREEN),
            ("DISABLED", ANSI_RED),
            ("FAILED", ANSI_RED),
            ("ERROR", ANSI_RED),
            ("WARNING", ANSI_YELLOW),
            ("FALLBACK", ANSI_YELLOW),
            ("SKIPPED", ANSI_YELLOW),
        )
        styled = msg
        for keyword, color in highlights:
            styled = re.sub(
                rf"\b{re.escape(keyword)}\b",
                lambda match, c=color: self._wrap(match.group(0), c),
                styled,
                flags=re.IGNORECASE,
            )
        return styled

    def send_notification(self, service: enumMcs.MicroservicesNames, type_id: int, msg: str) -> None:
        """
        Send a notification to the console.
        """
        type_helper = enumMcs.NotificationTypes()
        level = type_helper.get_type(type_id)
        level_color = {0: ANSI_GREEN, 1: ANSI_YELLOW, 2: ANSI_RED}.get(type_id, ANSI_CYAN)
        prefix = f"[{self._wrap(level, level_color)}|{self._wrap(service.name, ANSI_CYAN)}]"
        print(f"{prefix} {self._highlight_message(msg)}", flush=True)

    def send_start_notification(self, service: enumMcs.MicroservicesNames, successful: bool) -> None:
        """
        Send a start notification to the console with the status of the service.
        """
        if successful:
            self.send_notification(service, 0, f"{service.name} started successfully!")
        else:
            self.send_notification(service, 2, f"Failed to start {service.name}")
