import { useEffect } from "react";
import classNames from "classnames/bind";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";

import styles from "./RichTextEditor.module.scss";

const cx = classNames.bind(styles);

function normalizeEditorHtml(value) {
    if (!value) return "";

    const trimmed = String(value).trim();
    if (!trimmed || trimmed === "<p></p>" || trimmed === "<p><br></p>") {
        return "";
    }

    return trimmed;
}

function ToolbarButton({ active, disabled, onClick, label }) {
    return (
        <button
            type="button"
            className={cx("toolbarButton", { active })}
            onClick={onClick}
            disabled={disabled}
        >
            {label}
        </button>
    );
}

function RichTextEditor({
    value,
    onChange,
    placeholder,
    size = "md",
}) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            Placeholder.configure({
                placeholder,
            }),
        ],
        content: normalizeEditorHtml(value),
        immediatelyRender: false,
        onUpdate: ({ editor: currentEditor }) => {
            onChange(normalizeEditorHtml(currentEditor.getHTML()));
        },
        editorProps: {
            attributes: {
                class: "rich-text-content",
            },
        },
    });

    useEffect(() => {
        if (!editor) return;

        const nextValue = normalizeEditorHtml(value);
        const currentValue = normalizeEditorHtml(editor.getHTML());

        if (currentValue !== nextValue) {
            editor.commands.setContent(nextValue || "", false);
        }
    }, [editor, value]);

    if (!editor) {
        return (
            <div className={cx("editorShell", size)}>
                <div className={cx("editorLoading")} />
            </div>
        );
    }

    return (
        <div className={cx("editorShell", size)}>
            <div className={cx("toolbar")}>
                <ToolbarButton
                    active={editor.isActive("bold")}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    disabled={!editor.can().chain().focus().toggleBold().run()}
                    label="B"
                />
                <ToolbarButton
                    active={editor.isActive("italic")}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    disabled={!editor.can().chain().focus().toggleItalic().run()}
                    label="I"
                />
                <ToolbarButton
                    active={editor.isActive("underline")}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    disabled={!editor.can().chain().focus().toggleUnderline().run()}
                    label="U"
                />
                <ToolbarButton
                    active={editor.isActive("bulletList")}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    disabled={!editor.can().chain().focus().toggleBulletList().run()}
                    label="• List"
                />
                <ToolbarButton
                    active={editor.isActive("orderedList")}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    disabled={!editor.can().chain().focus().toggleOrderedList().run()}
                    label="1. List"
                />
                <ToolbarButton
                    active={false}
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    disabled={!editor.can().chain().focus().setHorizontalRule().run()}
                    label="---"
                />
                <span className={cx("toolbarDivider")} />
                <ToolbarButton
                    active={editor.isActive("table")}
                    onClick={() =>
                        editor
                            .chain()
                            .focus()
                            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                            .run()
                    }
                    disabled={!editor.can().chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                    label="Table"
                />
                <ToolbarButton
                    active={false}
                    onClick={() => editor.chain().focus().addRowAfter().run()}
                    disabled={!editor.can().chain().focus().addRowAfter().run()}
                    label="+ Row"
                />
                <ToolbarButton
                    active={false}
                    onClick={() => editor.chain().focus().deleteRow().run()}
                    disabled={!editor.can().chain().focus().deleteRow().run()}
                    label="- Row"
                />
                <ToolbarButton
                    active={false}
                    onClick={() => editor.chain().focus().addColumnAfter().run()}
                    disabled={!editor.can().chain().focus().addColumnAfter().run()}
                    label="+ Col"
                />
                <ToolbarButton
                    active={false}
                    onClick={() => editor.chain().focus().deleteColumn().run()}
                    disabled={!editor.can().chain().focus().deleteColumn().run()}
                    label="- Col"
                />
                <ToolbarButton
                    active={false}
                    onClick={() => editor.chain().focus().deleteTable().run()}
                    disabled={!editor.can().chain().focus().deleteTable().run()}
                    label="Del Table"
                />
                <span className={cx("toolbarDivider")} />
                <ToolbarButton
                    active={false}
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().chain().focus().undo().run()}
                    label="Undo"
                />
                <ToolbarButton
                    active={false}
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().chain().focus().redo().run()}
                    label="Redo"
                />
            </div>

            <EditorContent editor={editor} className={cx("editorContent")} />
        </div>
    );
}

export default RichTextEditor;
