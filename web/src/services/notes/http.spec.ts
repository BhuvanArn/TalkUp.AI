import { beforeEach, describe, expect, it, vi } from 'vitest';

const getMock = vi.hoisted(() => vi.fn());
const postMock = vi.hoisted(() => vi.fn());
const putMock = vi.hoisted(() => vi.fn());
const deleteMock = vi.hoisted(() => vi.fn());

vi.mock('@/services/axiosInstance', () => ({
  default: {
    get: getMock,
    post: postMock,
    put: putMock,
    delete: deleteMock,
  },
}));

import {
  createNote,
  deleteNote,
  getNoteById,
  getUserNotes,
  updateNote,
} from './http';

const sampleNote = {
  note_id: '1',
  user_id: 'u1',
  interview_id: null,
  title: 'Note 1',
  content: '<p>hi</p>',
  color: 'blue',
  is_favorite: false,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

describe('notesService', () => {
  beforeEach(() => {
    getMock.mockReset();
    postMock.mockReset();
    putMock.mockReset();
    deleteMock.mockReset();
  });

  it('getUserNotes with no params GETs the base url', async () => {
    getMock.mockResolvedValue({ data: [sampleNote] });
    const notes = await getUserNotes();
    expect(getMock).toHaveBeenCalledWith('/v1/api/notes');
    expect(notes).toEqual([sampleNote]);
  });

  it('getUserNotes with interviewId appends the query param', async () => {
    getMock.mockResolvedValue({ data: [] });
    await getUserNotes({ interviewId: 'int-1' });
    expect(getMock).toHaveBeenCalledWith('/v1/api/notes?interviewId=int-1');
  });

  it('getUserNotes with standalone appends standalone=true', async () => {
    getMock.mockResolvedValue({ data: [] });
    await getUserNotes({ standalone: true });
    expect(getMock).toHaveBeenCalledWith('/v1/api/notes?standalone=true');
  });

  it('getUserNotes with standalone=false does NOT append the standalone param', async () => {
    getMock.mockResolvedValue({ data: [] });
    await getUserNotes({ standalone: false });
    expect(getMock).toHaveBeenCalledWith('/v1/api/notes');
  });

  it('getNoteById GETs by id', async () => {
    getMock.mockResolvedValue({ data: sampleNote });
    const note = await getNoteById('1');
    expect(getMock).toHaveBeenCalledWith('/v1/api/notes/1');
    expect(note).toEqual(sampleNote);
  });

  it('createNote POSTs the dto', async () => {
    postMock.mockResolvedValue({ data: sampleNote });
    const dto = { title: 'x', content: '<p>y</p>', interviewId: 'int-1' };
    const note = await createNote(dto);
    expect(postMock).toHaveBeenCalledWith('/v1/api/notes', dto);
    expect(note).toEqual(sampleNote);
  });

  it('updateNote PUTs the dto to the id url', async () => {
    putMock.mockResolvedValue({ data: sampleNote });
    await updateNote('1', { title: 'renamed' });
    expect(putMock).toHaveBeenCalledWith('/v1/api/notes/1', { title: 'renamed' });
  });

  it('deleteNote DELETEs the id url', async () => {
    deleteMock.mockResolvedValue({ data: undefined });
    await deleteNote('1');
    expect(deleteMock).toHaveBeenCalledWith('/v1/api/notes/1');
  });

  it('propagates errors (and logs)', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getMock.mockRejectedValue(new Error('network'));
    await expect(getNoteById('1')).rejects.toThrow('network');
    consoleSpy.mockRestore();
  });
});
