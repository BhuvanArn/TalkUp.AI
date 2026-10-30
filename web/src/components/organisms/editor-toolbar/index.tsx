import { Button } from '@/components/atoms/button';
import { Icon } from '@/components/atoms/icon';
import { SelectorInput } from '@/components/atoms/selector-input';
import { useToolbarResize } from '@/hooks/utils/useToolbarResize';
import { type FC, memo } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { EditorToolbarProps, ToolbarButtonProps } from './types';

/**
 * ToolbarButton: compact icon button for toolbar actions.
 * @param props: onClick(), icon: IconName, title: string, isActive?: boolean, disabled?: boolean
 */
const ToolbarButton: FC<ToolbarButtonProps> = memo(
  ({ onClick, icon, title, isActive = false, disabled = false }) => (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant="text"
      size="sm"
      color={isActive ? 'accent' : 'neutral'}
      title={title}
      className={`min-w-0 shrink-0 ${isActive ? 'bg-accent-weaker' : ''}`}
    >
      <Icon icon={icon} size="sm" />
    </Button>
  ),
);
ToolbarButton.displayName = 'ToolbarButton';

/** ColorPickerButton: compact icon button that opens native color picker.
 * @param props: onColorChange(color: string), icon: 'palette'|'highlighter', title: string
 */
const ColorPickerButton = ({
  onColorChange,
  icon,
  title,
}: {
  onColorChange: (color: string) => void;
  icon: 'palette' | 'highlighter';
  title: string;
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="relative inline-block">
      <Button
        variant="text"
        size="sm"
        color="neutral"
        className="min-w-0 shrink-0"
        title={title}
        onClick={() => inputRef.current?.click()}
      >
        <Icon icon={icon} size="sm" />
      </Button>
      <input
        ref={inputRef}
        type="color"
        onChange={(e) => onColorChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
        aria-label={title}
      />
    </div>
  );
};
ColorPickerButton.displayName = 'ColorPickerButton';

/**
 * Separator: a vertical divider for the toolbar.
 */
const Separator = () => <div className="w-px h-6 bg-gray-300 shrink-0" />;
Separator.displayName = 'Separator';

/**
 * EditorToolbar: a toolbar component for text editing actions.
 *
 * @param props:
 * - editor: the rich text editor instance
 * - [editorProps]: fontFamilyOptions, fontSizeOptions, onFontFamilyChange, onFontSizeChange,
 *   onDecreaseFontSize, onIncreaseFontSize, toggleCase, onBoldClick, onItalicClick,
 *   onUnderlineClick, onStrikeClick, onTextColorChange, onHighlightColorChange, onRemoveFormat,
 *   onOrderedListClick, onTaskListClick, onBulletListClick, onAlignLeftClick, onAlignCenterClick,
 *   onAlignRightClick, onAlignJustifyClick, onUndoClick, onRedoClick
 *
 * @returns: JSX.Element - the rendered toolbar component
 */
export const EditorToolbar: FC<EditorToolbarProps> = ({
  editor,
  fontSize,
  fontFamily,
  fontFamilyOptions,
  fontSizeOptions,
  onFontFamilyChange,
  onFontSizeChange,
  onDecreaseFontSize,
  onIncreaseFontSize,
  toggleCase,
  onBoldClick,
  onItalicClick,
  onUnderlineClick,
  onStrikeClick,
  onTextColorChange,
  onHighlightColorChange,
  onRemoveFormat,
  onOrderedListClick,
  onTaskListClick,
  onBulletListClick,
  onAlignLeftClick,
  onAlignCenterClick,
  onAlignRightClick,
  onAlignJustifyClick,
  onUndoClick,
  onRedoClick,
}) => {
  const { t } = useTranslation('app');
  const isAlignLeftActive =
    editor.isActive({ textAlign: 'left' }) ||
    (!editor.isActive({ textAlign: 'center' }) &&
      !editor.isActive({ textAlign: 'right' }) &&
      !editor.isActive({ textAlign: 'justify' }));

  const {
    containerRef,
    dropdownRef,
    hiddenGroups,
    moreOpen,
    setMoreOpen,
    shouldShowSeparator,
  } = useToolbarResize();

  return (
    <>
      <div
        ref={containerRef}
        className="relative flex justify-around items-center gap-2 h-10 overflow-hidden bg-white w-full min-w-0 px-1 rounded-[10px]"
        role="toolbar"
        aria-label={t('editor.toolbar')}
      >
        {/* Font Family */}
        <div
          data-group="fontFamily"
          className={`${hiddenGroups.includes('fontFamily') ? 'hidden' : 'flex'} items-center`}
        >
          <SelectorInput
            options={fontFamilyOptions}
            onChange={(e) => onFontFamilyChange(e.target.value)}
            className="px-2 py-1 rounded border-0 text-sm hover:bg-gray-100 bg-transparent max-w-[180px] shrink-0"
            title={t('editor.fontFamily')}
            value={fontFamily ?? 'mixed'}
          />
        </div>
        {shouldShowSeparator('fontFamily') && <Separator />}

        {/* Font Size */}
        <div
          data-group="fontSize"
          className={`${hiddenGroups.includes('fontSize') ? 'hidden' : 'flex'} items-center shrink-0`}
          style={{ gap: 'clamp(2px, 0.5vw, 4px)' }}
        >
          <Button
            onClick={onDecreaseFontSize}
            variant="text"
            size="sm"
            title={t('editor.decreaseFontSize')}
            className="p-1 min-w-0"
          >
            <Icon icon="minus" size="xs" />
          </Button>
          <SelectorInput
            value={fontSize === 0 ? 'mixed' : fontSize.toString()}
            options={fontSizeOptions}
            hideCaret
            onChange={(e) => onFontSizeChange(parseInt(e.target.value))}
            className="px-2 py-1 rounded border-0 text-sm hover:bg-gray-100 bg-transparent w-14 text-center"
            title={t('editor.fontSize')}
          />
          <Button
            onClick={onIncreaseFontSize}
            variant="text"
            size="sm"
            title={t('editor.increaseFontSize')}
            className="p-1 min-w-0"
          >
            <Icon icon="plus" size="xs" />
          </Button>
        </div>
        {shouldShowSeparator('fontSize') && <Separator />}

        {/* Formatting */}
        <div
          data-group="formatting"
          className={`${hiddenGroups.includes('formatting') ? 'hidden' : 'flex'} items-center gap-1 shrink-0`}
        >
          <ToolbarButton
            onClick={onBoldClick}
            icon="bold"
            title={t('editor.bold')}
            isActive={editor.isActive('bold')}
          />
          <ToolbarButton
            onClick={onItalicClick}
            icon="italic"
            title={t('editor.italic')}
            isActive={editor.isActive('italic')}
          />
          <ToolbarButton
            onClick={onUnderlineClick}
            icon="underline"
            title={t('editor.underline')}
            isActive={editor.isActive('underline')}
          />
          <ToolbarButton
            onClick={onStrikeClick}
            icon="strikethrough"
            title={t('editor.strikethrough')}
            isActive={editor.isActive('strike')}
          />
        </div>
        {shouldShowSeparator('formatting') && <Separator />}

        {/* Styling */}
        <div
          data-group="styling"
          className={`${hiddenGroups.includes('styling') ? 'hidden' : 'flex'} items-center gap-1 shrink-0`}
        >
          <ToolbarButton
            onClick={toggleCase}
            icon="format-color-text"
            title={t('editor.toggleCase')}
          />
          <ColorPickerButton
            onColorChange={onTextColorChange}
            icon="palette"
            title={t('editor.textColor')}
          />
          <ColorPickerButton
            onColorChange={onHighlightColorChange}
            icon="highlighter"
            title={t('editor.highlightColor')}
          />
          <ToolbarButton
            onClick={onRemoveFormat}
            icon="remove-format"
            title={t('editor.removeFormat')}
          />
        </div>
        {shouldShowSeparator('styling') && <Separator />}

        {/* Lists */}
        <div
          data-group="lists"
          className={`${hiddenGroups.includes('lists') ? 'hidden' : 'flex'} items-center gap-1 shrink-0`}
        >
          <ToolbarButton
            onClick={onOrderedListClick}
            icon="list-ol"
            title={t('editor.numberedList')}
            isActive={editor.isActive('orderedList')}
          />
          <ToolbarButton
            onClick={onBulletListClick}
            icon="list-ul"
            title={t('editor.bulletedList')}
            isActive={editor.isActive('bulletList')}
          />
          <ToolbarButton
            onClick={onTaskListClick}
            icon="tasks"
            title={t('editor.checklist')}
            isActive={editor.isActive('taskList')}
          />
        </div>
        {shouldShowSeparator('lists') && <Separator />}

        {/* Alignment */}
        <div
          data-group="alignment"
          className={`${hiddenGroups.includes('alignment') ? 'hidden' : 'flex'} items-center gap-1 shrink-0`}
        >
          <ToolbarButton
            onClick={onAlignLeftClick}
            icon="align-left"
            title={t('editor.alignLeft')}
            isActive={isAlignLeftActive}
          />
          <ToolbarButton
            onClick={onAlignCenterClick}
            icon="align-center"
            title={t('editor.alignCenter')}
            isActive={editor.isActive({ textAlign: 'center' })}
          />
          <ToolbarButton
            onClick={onAlignRightClick}
            icon="align-right"
            title={t('editor.alignRight')}
            isActive={editor.isActive({ textAlign: 'right' })}
          />
          <ToolbarButton
            onClick={onAlignJustifyClick}
            icon="align-justify"
            title={t('editor.justify')}
            isActive={editor.isActive({ textAlign: 'justify' })}
          />
        </div>
        {shouldShowSeparator('alignment') && <Separator />}

        {/* History */}
        <div
          data-group="history"
          className={`flex items-center gap-1 shrink-0`}
        >
          <ToolbarButton
            onClick={onUndoClick}
            icon="undo"
            title={t('editor.undo')}
            disabled={!editor.can().undo()}
          />
          <ToolbarButton
            onClick={onRedoClick}
            icon="redo"
            title={t('editor.redo')}
            disabled={!editor.can().redo()}
          />
        </div>

        {/* More menu button */}
        {hiddenGroups.length > 0 && (
          <div data-more="true" className="flex items-center ml-1">
            <Button
              onClick={() => setMoreOpen((s) => !s)}
              variant="text"
              size="sm"
              title={t('editor.moreOptions')}
              className="min-w-0"
              aria-label={t('editor.moreOptions')}
              aria-expanded={moreOpen}
              aria-haspopup="true"
            >
              <Icon icon="more-vert" size="md" />
            </Button>
          </div>
        )}
      </div>

      {/* More menu dropdown */}
      {moreOpen && hiddenGroups.length > 0 && (
        <div ref={dropdownRef} className="relative">
          <div
            className="absolute right-0 top-3 w-56 max-h-96 overflow-y-auto bg-white rounded-[10px] shadow-lg z-50 p-4 gap-4 flex flex-col"
            role="menu"
            aria-label={t('editor.additionalOptions')}
          >
            {hiddenGroups.includes('fontFamily') && (
              <div className="">
                <div className="text-xs text-gray-500 mb-1">Font</div>
                <SelectorInput
                  options={fontFamilyOptions}
                  onChange={(e) => onFontFamilyChange(e.target.value)}
                  className="w-full px-2 py-1 rounded border text-sm"
                  title={t('editor.fontFamily')}
                  value={fontFamily ?? 'mixed'}
                />
              </div>
            )}
            {hiddenGroups.includes('fontSize') && (
              <div className="">
                <div className="text-xs text-gray-500 mb-1">Size</div>
                <div className="flex items-center gap-1 justify-center">
                  <Button
                    onClick={onDecreaseFontSize}
                    variant="text"
                    size="sm"
                    title={t('editor.decreaseFontSize')}
                    className="p-1 min-w-0"
                  >
                    <Icon icon="minus" size="xs" />
                  </Button>
                  <SelectorInput
                    value={fontSize === 0 ? 'mixed' : fontSize.toString()}
                    options={fontSizeOptions}
                    onChange={(e) => onFontSizeChange(parseInt(e.target.value))}
                    hideCaret
                    className="px-2 py-1 rounded border-0 text-sm hover:bg-gray-100 bg-transparent w-14 text-center"
                    title={t('editor.fontSize')}
                  />
                  <Button
                    onClick={onIncreaseFontSize}
                    variant="text"
                    size="sm"
                    title={t('editor.increaseFontSize')}
                    className="p-1 min-w-0"
                  >
                    <Icon icon="plus" size="xs" />
                  </Button>
                </div>
              </div>
            )}
            {(
              [
                {
                  group: 'formatting',
                  label: t('editor.groups.formatting'),
                  buttons: [
                    {
                      onClick: onBoldClick,
                      icon: 'bold' as const,
                      title: t('editor.bold'),
                      isActive: editor.isActive('bold'),
                    },
                    {
                      onClick: onItalicClick,
                      icon: 'italic' as const,
                      title: t('editor.italic'),
                      isActive: editor.isActive('italic'),
                    },
                    {
                      onClick: onUnderlineClick,
                      icon: 'underline' as const,
                      title: t('editor.underline'),
                      isActive: editor.isActive('underline'),
                    },
                    {
                      onClick: onStrikeClick,
                      icon: 'strikethrough' as const,
                      title: t('editor.strikethrough'),
                      isActive: editor.isActive('strike'),
                    },
                  ],
                },
                {
                  group: 'lists',
                  label: t('editor.groups.lists'),
                  buttons: [
                    {
                      onClick: onOrderedListClick,
                      icon: 'list-ol' as const,
                      title: t('editor.numberedList'),
                      isActive: editor.isActive('orderedList'),
                    },
                    {
                      onClick: onBulletListClick,
                      icon: 'list-ul' as const,
                      title: t('editor.bulletedList'),
                      isActive: editor.isActive('bulletList'),
                    },
                    {
                      onClick: onTaskListClick,
                      icon: 'tasks' as const,
                      title: t('editor.checklist'),
                      isActive: editor.isActive('taskList'),
                    },
                  ],
                },
                {
                  group: 'alignment',
                  label: t('editor.groups.alignment'),
                  buttons: [
                    {
                      onClick: onAlignLeftClick,
                      icon: 'align-left' as const,
                      title: t('editor.alignLeft'),
                      isActive: isAlignLeftActive,
                    },
                    {
                      onClick: onAlignCenterClick,
                      icon: 'align-center' as const,
                      title: t('editor.alignCenter'),
                      isActive: editor.isActive({ textAlign: 'center' }),
                    },
                    {
                      onClick: onAlignRightClick,
                      icon: 'align-right' as const,
                      title: t('editor.alignRight'),
                      isActive: editor.isActive({ textAlign: 'right' }),
                    },
                    {
                      onClick: onAlignJustifyClick,
                      icon: 'align-justify' as const,
                      title: t('editor.justify'),
                      isActive: editor.isActive({ textAlign: 'justify' }),
                    },
                  ],
                },
              ] as const
            ).map(
              ({ group, label, buttons }) =>
                hiddenGroups.includes(group) && (
                  <div key={group} className="">
                    <div className="text-xs text-gray-500 mb-1">{label}</div>
                    <div className="flex gap-1 flex-wrap justify-center">
                      {buttons.map((btn, i) => (
                        <ToolbarButton key={i} {...btn} onClick={btn.onClick} />
                      ))}
                    </div>
                  </div>
                ),
            )}
            {hiddenGroups.includes('styling') && (
              <div className="">
                <div className="text-xs text-gray-500 mb-1">
                  {t('editor.groups.styling')}
                </div>
                <div className="flex gap-1 flex-wrap justify-center">
                  <ToolbarButton
                    onClick={toggleCase}
                    icon="format-color-text"
                    title={t('editor.toggleCase')}
                  />
                  <ColorPickerButton
                    onColorChange={onTextColorChange}
                    icon="palette"
                    title={t('editor.textColor')}
                  />
                  <ColorPickerButton
                    onColorChange={onHighlightColorChange}
                    icon="highlighter"
                    title={t('editor.highlightColor')}
                  />
                  <ToolbarButton
                    onClick={onRemoveFormat}
                    icon="remove-format"
                    title={t('editor.removeFormat')}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
EditorToolbar.displayName = 'EditorToolbar';
