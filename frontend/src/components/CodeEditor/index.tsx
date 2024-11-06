import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { langs } from "@uiw/codemirror-extensions-langs";
import { basicSetup } from "@uiw/codemirror-extensions-basic-setup";
import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { indentUnit } from "@codemirror/language";
import { useEffect, useState } from "react";
import { initDocument } from "../../utils/collabSocket";
import { cursorExtension } from "../../utils/collabCursor";
import { yCollab } from "y-codemirror.next";
import { Text } from "yjs";
import { Awareness } from "y-protocols/awareness";
import { useCollab } from "../../contexts/CollabContext";
import { USE_COLLAB_ERROR_MESSAGE } from "../../utils/constants";

interface CodeEditorProps {
  editorState?: { text: Text; awareness: Awareness };
  uid?: string;
  username?: string;
  language: string;
  template?: string;
  roomId?: string;
  isReadOnly?: boolean;
  isRejoin?: boolean;
}

const languageSupport = {
  Python: langs.python(),
  Java: langs.java(),
  C: langs.c(),
};

const CodeEditor: React.FC<CodeEditorProps> = (props) => {
  const {
    editorState,
    uid = "",
    username = "",
    language,
    template = "",
    roomId = "",
    isReadOnly = false,
    isRejoin = false,
  } = props;

  const collab = useCollab();
  if (!collab) {
    throw new Error(USE_COLLAB_ERROR_MESSAGE);
  }

  const { setCode, isPartnerConnected } = collab;

  const [isEditorReady, setIsEditorReady] = useState<boolean>(false);
  const [isDocumentLoaded, setIsDocumentLoaded] = useState<boolean>(false);

  const onEditorReady = (editor: ReactCodeMirrorRef) => {
    if (!isEditorReady && editor?.editor && editor?.state && editor?.view) {
      setIsEditorReady(true);
    }
  };

  const handleChange = (value: string) => {
    setCode(value);
  };

  useEffect(() => {
    if (isReadOnly || !isEditorReady) {
      return;
    }

    if (!uid || !roomId) {
      console.error("Missing user ID and / or room ID");
      return;
    }

    const loadTemplate = async () => {
      await initDocument(uid, roomId, template, isRejoin);
      setIsDocumentLoaded(true);
    };
    loadTemplate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReadOnly, isEditorReady]);

  if (!isReadOnly && !(uid && roomId)) {
    return <></>;
  }

  return (
    <CodeMirror
      ref={onEditorReady}
      style={{ height: "100%", width: "100%", fontSize: "14px" }}
      height="100%"
      width="100%"
      basicSetup={false}
      id="codeEditor"
      onChange={handleChange}
      extensions={[
        indentUnit.of("\t"),
        basicSetup(),
        languageSupport[language as keyof typeof languageSupport],
        ...(!isReadOnly && editorState
          ? [
              yCollab(editorState.text, editorState.awareness),
              cursorExtension(roomId, uid, username),
            ]
          : []),
        EditorView.lineWrapping,
        EditorView.editable.of(
          !isReadOnly && isDocumentLoaded && isPartnerConnected
        ),
        EditorState.readOnly.of(
          isReadOnly || !isDocumentLoaded || !isPartnerConnected
        ),
      ]}
      value={isReadOnly ? template : undefined}
      placeholder={
        !isReadOnly && !isDocumentLoaded
          ? "Loading code template..."
          : undefined
      }
    />
  );
};

export default CodeEditor;
