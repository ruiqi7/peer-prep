/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  USE_MATCH_ERROR_MESSAGE,
  FAILED_TESTCASE_MESSAGE,
  SUCCESS_TESTCASE_MESSAGE,
  FAILED_TO_SUBMIT_CODE_MESSAGE,
  COLLAB_ENDED_MESSAGE,
  COLLAB_PARTNER_DISCONNECTED_MESSAGE,
  COLLAB_PARTNER_RECONNECTED_MESSAGE,
} from "../utils/constants";
import { toast } from "react-toastify";

import { useMatch } from "./MatchContext";
import { qnHistoryClient, codeExecutionClient } from "../utils/api";
import { useReducer } from "react";
import { updateQnHistoryById } from "../reducers/qnHistoryReducer";
import qnHistoryReducer, { initialQHState } from "../reducers/qnHistoryReducer";
import { CollabEvents, collabSocket, leave } from "../utils/collabSocket";
import {
  CommunicationEvents,
  communicationSocket,
} from "../utils/communicationSocket";
import useAppNavigate from "../hooks/useAppNavigate";
import { applyUpdateV2, Doc } from "yjs";

export type CompilerResult = {
  status: string;
  exception: string | null;
  stdout: string;
  stderr: string | null;
  executionTime: number;
  stdin: string;
  stout: string;
  actualResult: string;
  expectedResult: string;
  isMatch: boolean;
};

type CollabContextType = {
  handleSubmitSessionClick: () => void;
  handleEndSessionClick: () => void;
  handleRejectEndSession: () => void;
  handleConfirmEndSession: () => void;
  checkPartnerStatus: (uid: string, doc: Doc) => void;
  setCode: React.Dispatch<React.SetStateAction<string>>;
  compilerResult: CompilerResult[];
  setCompilerResult: React.Dispatch<React.SetStateAction<CompilerResult[]>>;
  isEndSessionModalOpen: boolean;
  time: number;
  resetCollab: () => void;
  isPartnerConnected: boolean;
};

const CollabContext = createContext<CollabContextType | null>(null);

const CollabProvider: React.FC<{ children?: React.ReactNode }> = (props) => {
  const { children } = props;
  const appNavigate = useAppNavigate();

  const match = useMatch();

  if (!match) {
    throw new Error(USE_MATCH_ERROR_MESSAGE);
  }

  const {
    // matchUser,
    // partner,
    matchCriteria,
    // getMatchId,
    stopMatch,
    questionId,
    qnHistoryId,
  } = match;

  const [time, setTime] = useState<number>(0);

  useEffect(() => {
    const intervalId = setInterval(
      () => setTime((prevTime) => prevTime + 1),
      1000
    );

    return () => clearInterval(intervalId);
  }, [time]);

  // eslint-disable-next-line
  const [_qnHistoryState, qnHistoryDispatch] = useReducer(
    qnHistoryReducer,
    initialQHState
  );
  const [code, setCode] = useState<string>("");
  const [compilerResult, setCompilerResult] = useState<CompilerResult[]>([]);
  const [isEndSessionModalOpen, setIsEndSessionModalOpen] =
    useState<boolean>(false);
  const [isPartnerConnected, setIsPartnerConnected] = useState<boolean>(true);

  const handleSubmitSessionClick = async () => {
    try {
      const res = await codeExecutionClient.post("/", {
        questionId,
        // Replace tabs with 4 spaces to prevent formatting issues
        code: code.replace(/\t/g, " ".repeat(4)),
        language: matchCriteria?.language.toLowerCase(),
      });
      console.log([...res.data.data]);
      setCompilerResult([...res.data.data]);

      let isMatch = true;
      for (let i = 0; i < res.data.data.length; i++) {
        if (!res.data.data[i].isMatch) {
          isMatch = false;
          break;
        }
      }

      if (isMatch) {
        toast.success(SUCCESS_TESTCASE_MESSAGE);
      } else {
        toast.error(FAILED_TESTCASE_MESSAGE);
      }

      updateQnHistoryById(
        qnHistoryId as string,
        {
          submissionStatus: isMatch ? "Accepted" : "Rejected",
          dateAttempted: new Date().toISOString(),
          timeTaken: time,
          code,
        },
        qnHistoryDispatch
      );
    } catch {
      toast.error(FAILED_TO_SUBMIT_CODE_MESSAGE);
    }
  };

  const handleEndSessionClick = () => {
    setIsEndSessionModalOpen(true);
  };

  const handleRejectEndSession = () => {
    setIsEndSessionModalOpen(false);
  };

  const handleConfirmEndSession = async () => {
    setIsEndSessionModalOpen(false);

    // Get queston history
    const data = await qnHistoryClient.get(qnHistoryId as string);

    // Only update question history if it has not been submitted before
    if (!data.data.qnHistory.code) {
      updateQnHistoryById(
        qnHistoryId as string,
        {
          submissionStatus: "Attempted",
          dateAttempted: new Date().toISOString(),
          timeTaken: time,
          code: code.replace(/\t/g, " ".repeat(4)),
        },
        qnHistoryDispatch
      );
    }

    // Leave collaboration room
    // leave(matchUser?.id as string, getMatchId() as string, true);
    // leave(partner?.id as string, getMatchId() as string, true);

    // Leave chat room
    communicationSocket.emit(CommunicationEvents.USER_DISCONNECT);

    // Delete match data
    stopMatch();
    appNavigate("/home");

    // Reset collab state
    resetCollab();
  };

  const checkPartnerStatus = (uid: string, doc: Doc) => {
    collabSocket.on(CollabEvents.PARTNER_LEFT, () => {
      toast.error(COLLAB_ENDED_MESSAGE);
      setIsEndSessionModalOpen(false);
      // TODO
      stopMatch();
      appNavigate("/home");
    });

    collabSocket.on(CollabEvents.PARTNER_DISCONNECTED, () => {
      toast.error(COLLAB_PARTNER_DISCONNECTED_MESSAGE);
      setIsPartnerConnected(false);

      collabSocket.once(CollabEvents.UPDATE, (update) => {
        applyUpdateV2(doc, new Uint8Array(update), uid);
        toast.success(COLLAB_PARTNER_RECONNECTED_MESSAGE);
        setIsPartnerConnected(true);
      });
    });
  };

  const resetCollab = () => {
    setCompilerResult([]);
    setTime(0);
  };

  return (
    <CollabContext.Provider
      value={{
        handleSubmitSessionClick,
        handleEndSessionClick,
        handleRejectEndSession,
        handleConfirmEndSession,
        checkPartnerStatus,
        setCode,
        compilerResult,
        setCompilerResult,
        isEndSessionModalOpen,
        time,
        resetCollab,
        isPartnerConnected,
      }}
    >
      {children}
    </CollabContext.Provider>
  );
};

export const useCollab = () => useContext(CollabContext);

export default CollabProvider;
