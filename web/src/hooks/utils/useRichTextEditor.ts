import { Extension } from '@tiptap/core';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import i18next from 'i18next';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

/**
 * Custom TipTap extension for font size control.
 * Adds fontSize attribute to textStyle marks and provides commands to set/unset it.
 */
const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) =>
              element.style.fontSize.replace(/['"]+/g, ''),
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize) =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain()
            .setMark('textStyle', { fontSize: null })
            .removeEmptyTextStyle()
            .run();
        },
    };
  },
});

// Default font (Inter) shown in label so users know what's used without explicit font-family.
// Its label is translated at render time (`editor.defaultFont`).
export const FONT_FAMILIES = [
  { label: 'Default (Inter)', value: '' },
  { label: 'Saira', value: 'Saira, sans-serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: 'Times New Roman, serif' },
  { label: 'Courier New', value: 'Courier New, monospace' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Comic Sans MS', value: 'Comic Sans MS, cursive' },
];

export const FONT_SIZE_VALUES = [
  8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72,
];
export const FONT_SIZES = FONT_SIZE_VALUES.map((size) => ({
  label: size.toString(),
  value: size.toString(),
}));

/**
 * Hook for managing TipTap rich text editor with formatting controls.
 *
 * Provides:
 * - Configured TipTap editor instance with extensions
 * - Font family and size state with mixed formatting detection
 * - Handler functions for all formatting operations
 * - Dynamic font options that include "Mixed" when selection has mixed formatting
 *
 * @param initialContent - Optional HTML content to initialize the editor
 * @returns Editor instance, state, and formatting handler functions
 */
export const useRichTextEditor = (initialContent?: string) => {
  const { t } = useTranslation('app');
  const [fontSize, setFontSize] = useState(16);
  const [fontFamily, setFontFamily] = useState('');
  const [, forceUpdate] = useState({});

  /**
   * Detects mixed font formatting in the current selection.
   * Sets font family to "mixed" if multiple families are present (fontSize to 0 for sizes).
   * Updates state to reflect the current selection's formatting.
   */
  const detectMixedFormatting = (ed: ReturnType<typeof useEditor>) => {
    if (!ed) return;

    const { from, to } = ed.state.selection;
    const fontFamilies = new Set<string>();
    const fontSizes = new Set<string>();

    ed.state.doc.nodesBetween(from, to, (node) => {
      if (node.isText) {
        const marks = node.marks;
        marks.forEach((mark) => {
          if (mark.type.name === 'textStyle') {
            if (mark.attrs.fontFamily) {
              fontFamilies.add(mark.attrs.fontFamily);
            }
            if (mark.attrs.fontSize) {
              fontSizes.add(mark.attrs.fontSize);
            }
          }
        });
      }
    });

    if (fontFamilies.size > 1) {
      setFontFamily('mixed');
    } else if (fontFamilies.size === 1) {
      setFontFamily(Array.from(fontFamilies)[0]);
    } else {
      const currentFamily = ed.getAttributes('textStyle').fontFamily;
      setFontFamily(currentFamily || '');
    }

    if (fontSizes.size > 1) {
      setFontSize(0);
    } else if (fontSizes.size === 1) {
      const size = Array.from(fontSizes)[0];
      setFontSize(parseInt(size) || 16);
    } else {
      const currentSize = ed.getAttributes('textStyle').fontSize;
      setFontSize(currentSize ? parseInt(currentSize) : 16);
    }
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TextStyle,
      FontFamily,
      FontSize,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'left',
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder: i18next.t('app:editor.placeholder'),
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: initialContent || '',
    editorProps: {
      attributes: {
        class:
          'rich-editor-prose prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      detectMixedFormatting(editor);
      forceUpdate({});
    },
    onSelectionUpdate: ({ editor }) => {
      detectMixedFormatting(editor);
      forceUpdate({});
    },
    onTransaction: () => {
      forceUpdate({});
    },
  });

  /**
   * Toggles the case of selected text between uppercase and lowercase.
   */
  const toggleCase = () => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, '');

    const isUpperCase = text === text.toUpperCase();
    const newText = isUpperCase ? text.toLowerCase() : text.toUpperCase();

    editor
      .chain()
      .focus()
      .deleteRange({ from, to })
      .insertContent(newText)
      .run();
  };

  const onFontFamilyChange = (value: string) => {
    if (!editor) return;
    setFontFamily(value);
    editor.chain().focus().setFontFamily(value).run();
  };

  const onFontSizeChange = (size: number) => {
    if (!editor) return;
    setFontSize(size);
    editor.chain().focus().setFontSize(`${size}px`).run();
  };

  const onDecreaseFontSize = () => {
    if (!editor) return;
    const currentIndex = FONT_SIZE_VALUES.indexOf(fontSize);
    const newSize =
      currentIndex > 0 ? FONT_SIZE_VALUES[currentIndex - 1] : fontSize;
    setFontSize(newSize);
    editor.chain().focus().setFontSize(`${newSize}px`).run();
  };

  const onIncreaseFontSize = () => {
    if (!editor) return;
    const currentIndex = FONT_SIZE_VALUES.indexOf(fontSize);
    const newSize =
      currentIndex < FONT_SIZE_VALUES.length - 1
        ? FONT_SIZE_VALUES[currentIndex + 1]
        : fontSize;
    setFontSize(newSize);
    editor.chain().focus().setFontSize(`${newSize}px`).run();
  };

  const onBoldClick = () => {
    if (!editor) return;
    editor.chain().focus().toggleBold().run();
    forceUpdate({});
  };

  const onItalicClick = () => {
    if (!editor) return;
    editor.chain().focus().toggleItalic().run();
    forceUpdate({});
  };

  const onUnderlineClick = () => {
    if (!editor) return;
    editor.chain().focus().toggleUnderline().run();
    forceUpdate({});
  };

  const onStrikeClick = () => {
    if (!editor) return;
    editor.chain().focus().toggleStrike().run();
    forceUpdate({});
  };

  const onTextColorChange = (color: string) => {
    if (!editor) return;
    editor.chain().focus().setColor(color).run();
  };

  const onHighlightColorChange = (color: string) => {
    if (!editor) return;
    editor.chain().focus().toggleHighlight({ color }).run();
  };

  const onRemoveFormat = () => {
    if (!editor) return;
    editor.chain().focus().clearNodes().unsetAllMarks().run();
  };

  const onOrderedListClick = () => {
    if (!editor) return;
    editor.chain().focus().toggleOrderedList().run();
  };

  const onBulletListClick = () => {
    if (!editor) return;
    editor.chain().focus().toggleBulletList().run();
  };

  const onTaskListClick = () => {
    if (!editor) return;
    editor.chain().focus().toggleTaskList().run();
  };

  const onAlignLeftClick = () => {
    if (!editor) return;
    editor.chain().focus().setTextAlign('left').run();
  };

  const onAlignCenterClick = () => {
    if (!editor) return;
    editor.chain().focus().setTextAlign('center').run();
  };

  const onAlignRightClick = () => {
    if (!editor) return;
    editor.chain().focus().setTextAlign('right').run();
  };

  const onAlignJustifyClick = () => {
    if (!editor) return;
    editor.chain().focus().setTextAlign('justify').run();
  };

  const onUndoClick = () => {
    if (!editor) return;
    editor.chain().focus().undo().run();
  };

  const onRedoClick = () => {
    if (!editor) return;
    editor.chain().focus().redo().run();
  };

  const fontFamilies = FONT_FAMILIES.map((font) =>
    font.value === '' ? { ...font, label: t('editor.defaultFont') } : font,
  );
  const mixedOption = { label: t('editor.mixed'), value: 'mixed' };

  const fontFamilyOptions =
    fontFamily === 'mixed' ? [mixedOption, ...fontFamilies] : fontFamilies;

  const fontSizeOptions =
    fontSize === 0 ? [mixedOption, ...FONT_SIZES] : FONT_SIZES;

  return {
    editor,
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    fontFamilyOptions,
    fontSizeOptions,
    toggleCase,
    onFontFamilyChange,
    onFontSizeChange,
    onDecreaseFontSize,
    onIncreaseFontSize,
    onBoldClick,
    onItalicClick,
    onUnderlineClick,
    onStrikeClick,
    onTextColorChange,
    onHighlightColorChange,
    onRemoveFormat,
    onOrderedListClick,
    onBulletListClick,
    onTaskListClick,
    onAlignLeftClick,
    onAlignCenterClick,
    onAlignRightClick,
    onAlignJustifyClick,
    onUndoClick,
    onRedoClick,
  };
};
