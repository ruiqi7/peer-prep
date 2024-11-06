/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useContext, useState } from "react";
import {
  USE_MATCH_ERROR_MESSAGE,
  FAILED_TESTCASE_MESSAGE,
  SUCCESS_TESTCASE_MESSAGE,
  FAILED_TO_SUBMIT_CODE_MESSAGE,
  COLLAB_ENDED_MESSAGE,
} from "../utils/constants";
import { toast } from "react-toastify";

import { useMatch } from "./MatchContext";
import { codeExecutionClient } from "../utils/api";
import { useReducer } from "react";
import { updateQnHistoryById } from "../reducers/qnHistoryReducer";
import qnHistoryReducer, { initialQHState } from "../reducers/qnHistoryReducer";
import { CollabEvents, collabSocket, leave } from "../utils/collabSocket";
import { communicationSocket } from "../utils/communicationSocket";
import useAppNavigate from "../components/UseAppNavigate";

type CompilerResult = {
  status: string;
  exception: string | null;
  stdout: string;
  stderr: string | null;
  executionTime: number;
  stdin: string;
  stout: string;
  actualResult: string;
  expectedResult: string;
};

type CollabContextType = {
  handleSubmitSessionClick: (time: number) => void;
  handleEndSessionClick: () => void;
  handleRejectEndSession: () => void;
  handleConfirmEndSession: () => void;
  checkPartnerStatus: () => void;
  setCode: React.Dispatch<React.SetStateAction<string>>;
  compilerResult: CompilerResult[];
  isEndSessionModalOpen: boolean;
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
    matchUser,
    partner,
    matchCriteria,
    getMatchId,
    stopMatch,
    questionId,
    qnHistoryId,
  } = match;

  // eslint-disable-next-line
  const [_qnHistoryState, qnHistoryDispatch] = useReducer(
    qnHistoryReducer,
    initialQHState
  );
  const [code, setCode] = useState<string>("");
  const [compilerResult, setCompilerResult] = useState<CompilerResult[]>([]);
  const [isEndSessionModalOpen, setIsEndSessionModalOpen] =
    useState<boolean>(false);

  const handleSubmitSessionClick = async (time: number) => {
    try {
      const res = await codeExecutionClient.post("/", {
        questionId,
        code,
        language: matchCriteria?.language.toLowerCase(),
      });

      console.log(res.data.data);
      setCompilerResult(res.data.data);

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

  const handleConfirmEndSession = () => {
    setIsEndSessionModalOpen(false);

    // Leave collaboration room
    leave(matchUser?.id as string, getMatchId() as string, true);
    leave(partner?.id as string, getMatchId() as string, true);

    communicationSocket.disconnect();

    // Delete match data
    stopMatch();
    appNavigate("/home");
  };

  const checkPartnerStatus = () => {
    collabSocket.on(CollabEvents.PARTNER_LEFT, () => {
      toast.error(COLLAB_ENDED_MESSAGE);
      setIsEndSessionModalOpen(false);
      stopMatch();
      appNavigate("/home");
    });
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
        isEndSessionModalOpen,
      }}
    >
      {children}
    </CollabContext.Provider>
  );
};

export const useCollab = () => useContext(CollabContext);

export default CollabProvider;
