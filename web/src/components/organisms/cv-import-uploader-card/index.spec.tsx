import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { UploaderCard } from './index';

vi.mock('../../atoms/cv-import-file-badge', () => ({
  FileBadge: ({ label }: { label: string }) => (
    <span data-testid={`badge-${label}`}>{label}</span>
  ),
}));

vi.mock('../../molecules/cv-import-stepper', () => ({
  Stepper: ({ currentStep }: { currentStep: number }) => (
    <div data-testid="stepper">Step {currentStep}</div>
  ),
}));

const defaultProps = {
  onFileSelect: vi.fn(),
};

describe('UploaderCard', () => {
  describe('Initial render', () => {
    it('renders without crashing', () => {
      render(<UploaderCard {...defaultProps} />);
      expect(
        screen.getByText('Drag and drop your CV here'),
      ).toBeInTheDocument();
    });

    it('renders the stepper with default step 1', () => {
      render(<UploaderCard {...defaultProps} />);
      expect(screen.getByTestId('stepper')).toHaveTextContent('Step 1');
    });

    it('renders the stepper with custom step', () => {
      render(<UploaderCard {...defaultProps} step={2} />);
      expect(screen.getByTestId('stepper')).toHaveTextContent('Step 2');
    });

    it('renders the browse files label', () => {
      render(<UploaderCard {...defaultProps} />);
      expect(screen.getByText('browse your files')).toBeInTheDocument();
    });

    it('renders the max size text', () => {
      render(<UploaderCard {...defaultProps} />);
      expect(screen.getByText('Max size: 5 MB')).toBeInTheDocument();
    });

    it('renders all file format badges', () => {
      render(<UploaderCard {...defaultProps} />);
      expect(screen.getByTestId('badge-PDF')).toBeInTheDocument();
      expect(screen.getByTestId('badge-DOCX')).toBeInTheDocument();
      expect(screen.getByTestId('badge-DOC')).toBeInTheDocument();
    });

    it('renders the file input with correct accept attribute', () => {
      render(<UploaderCard {...defaultProps} />);
      const input = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input.accept).toBe('.pdf,.doc,.docx');
    });
  });

  describe('File selection via input', () => {
    it('calls onFileSelect when a file is chosen via input', () => {
      const onFileSelect = vi.fn();
      render(<UploaderCard {...defaultProps} onFileSelect={onFileSelect} />);
      const input = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      const file = new File(['content'], 'cv.pdf', { type: 'application/pdf' });
      fireEvent.change(input, { target: { files: [file] } });
      expect(onFileSelect).toHaveBeenCalledWith(file);
    });

    it('does not call onFileSelect when no file is selected', () => {
      const onFileSelect = vi.fn();
      render(<UploaderCard {...defaultProps} onFileSelect={onFileSelect} />);
      const input = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      fireEvent.change(input, { target: { files: [] } });
      expect(onFileSelect).not.toHaveBeenCalled();
    });

    it('shows an English error for an unsupported file format', () => {
      const onFileSelect = vi.fn();
      render(<UploaderCard {...defaultProps} onFileSelect={onFileSelect} />);
      const input = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      const file = new File(['x'], 'malware.exe', {
        type: 'application/x-msdownload',
      });
      fireEvent.change(input, { target: { files: [file] } });
      expect(onFileSelect).not.toHaveBeenCalled();
      expect(
        screen.getByText(
          'Unsupported file format. Please use a PDF, DOC or DOCX file.',
        ),
      ).toBeInTheDocument();
    });

    it('shows an English error when the file is too large', () => {
      const onFileSelect = vi.fn();
      render(<UploaderCard {...defaultProps} onFileSelect={onFileSelect} />);
      const input = document.querySelector(
        'input[type="file"]',
      ) as HTMLInputElement;
      const big = new File(['x'], 'cv.pdf', { type: 'application/pdf' });
      Object.defineProperty(big, 'size', { value: 6 * 1024 * 1024 });
      fireEvent.change(input, { target: { files: [big] } });
      expect(onFileSelect).not.toHaveBeenCalled();
      expect(
        screen.getByText('File is too large. Maximum size: 5 MB.'),
      ).toBeInTheDocument();
    });
  });

  describe('Drag and drop', () => {
    it('calls onFileSelect when a file is dropped', () => {
      const onFileSelect = vi.fn();
      render(<UploaderCard {...defaultProps} onFileSelect={onFileSelect} />);
      const file = new File(['content'], 'cv.pdf', { type: 'application/pdf' });
      const dropZone = screen
        .getByText('Drag and drop your CV here')
        .closest('div')!.parentElement!;
      fireEvent.drop(dropZone, { dataTransfer: { files: [file] } });
      expect(onFileSelect).toHaveBeenCalledWith(file);
    });

    it('applies the drag-active surface class on dragenter', () => {
      render(<UploaderCard {...defaultProps} />);
      const dropZone = screen
        .getByText('Drag and drop your CV here')
        .closest('div')!.parentElement!;
      fireEvent.dragEnter(dropZone);
      expect(dropZone.className).toContain('bg-surface');
    });

    it('removes the drag-active surface class on dragleave', () => {
      render(<UploaderCard {...defaultProps} />);
      const dropZone = screen
        .getByText('Drag and drop your CV here')
        .closest('div')!.parentElement!;
      fireEvent.dragEnter(dropZone);
      fireEvent.dragLeave(dropZone);
      expect(dropZone.className).not.toContain('bg-surface');
    });
  });

  describe('Deadline section', () => {
    it('renders the Interview date label', () => {
      render(<UploaderCard {...defaultProps} />);
      // The visible header and the sr-only input label share this text.
      expect(screen.getAllByText('Interview date').length).toBeGreaterThan(0);
    });

    it('renders the optional hint when no date is set', () => {
      render(<UploaderCard {...defaultProps} deadline={null} />);
      expect(
        screen.getByText(/Optional.*when is your interview/i),
      ).toBeInTheDocument();
    });

    it('renders the date input', () => {
      render(<UploaderCard {...defaultProps} />);
      expect(document.querySelector('input[type="date"]')).toBeInTheDocument();
    });

    it('labels the date input for accessibility', () => {
      render(<UploaderCard {...defaultProps} />);
      expect(screen.getByLabelText('Interview date')).toBeInTheDocument();
    });

    it('calls onDeadlineChange with a Date when a date is set', () => {
      const onDeadlineChange = vi.fn();
      render(
        <UploaderCard {...defaultProps} onDeadlineChange={onDeadlineChange} />,
      );
      const dateInput = document.querySelector(
        'input[type="date"]',
      ) as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: '2030-12-31' } });
      expect(onDeadlineChange).toHaveBeenCalledWith(new Date(2030, 11, 31));
    });

    it('calls onDeadlineChange with null when date is cleared', () => {
      const onDeadlineChange = vi.fn();
      render(
        <UploaderCard
          {...defaultProps}
          deadline={new Date(2030, 11, 31)}
          onDeadlineChange={onDeadlineChange}
        />,
      );
      const dateInput = document.querySelector(
        'input[type="date"]',
      ) as HTMLInputElement;
      fireEvent.change(dateInput, { target: { value: '' } });
      expect(onDeadlineChange).toHaveBeenCalledWith(null);
    });

    it('shows the clear button when a deadline is set', () => {
      render(
        <UploaderCard
          {...defaultProps}
          deadline={new Date(2030, 11, 31)}
          onDeadlineChange={vi.fn()}
        />,
      );
      expect(screen.getByTitle('Clear date')).toBeInTheDocument();
    });

    it('calls onDeadlineChange with null when clear button is clicked', () => {
      const onDeadlineChange = vi.fn();
      render(
        <UploaderCard
          {...defaultProps}
          deadline={new Date(2030, 11, 31)}
          onDeadlineChange={onDeadlineChange}
        />,
      );
      fireEvent.click(screen.getByTitle('Clear date'));
      expect(onDeadlineChange).toHaveBeenCalledWith(null);
    });

    it('shows overdue message when deadline has passed', () => {
      render(
        <UploaderCard
          {...defaultProps}
          deadline={new Date(2000, 0, 1)}
          onDeadlineChange={vi.fn()}
        />,
      );
      expect(screen.getByText('Overdue')).toBeInTheDocument();
      expect(screen.getByText('This date is in the past.')).toBeInTheDocument();
    });

    it('shows "Today!" badge when deadline is today', () => {
      const today = new Date();
      render(
        <UploaderCard
          {...defaultProps}
          deadline={today}
          onDeadlineChange={vi.fn()}
        />,
      );
      expect(screen.getByText('Today!')).toBeInTheDocument();
    });

    it('shows days remaining badge for future deadline', () => {
      const future = new Date();
      future.setDate(future.getDate() + 5);
      render(
        <UploaderCard
          {...defaultProps}
          deadline={future}
          onDeadlineChange={vi.fn()}
        />,
      );
      expect(screen.getByText('5 days left')).toBeInTheDocument();
    });
  });
});
