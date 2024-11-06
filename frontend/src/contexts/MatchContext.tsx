/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useContext, useEffect, useState } from "react";
import { matchSocket } from "../utils/matchSocket";
import {
  ABORT_MATCH_PROCESS_CONFIRMATION_MESSAGE,
  FAILED_MATCH_REQUEST_MESSAGE,
  MATCH_CONNECTION_ERROR,
  MATCH_LOGIN_REQUIRED_MESSAGE,
  MATCH_REQUEST_EXISTS_MESSAGE,
  MATCH_UNSUCCESSFUL_MESSAGE,
  USE_AUTH_ERROR_MESSAGE,
} from "../utils/constants";
import { useAuth } from "./AuthContext";
import { toast } from "react-toastify";
import useAppNavigate from "../hooks/useAppNavigate";
import { UNSAFE_NavigationContext } from "react-router-dom";
import { Action, type History, type Transition } from "history";

let matchUserId: string;
let partnerUserId: string;

type MatchUser = {
  id: string;
  username: string;
  profile?: string;
};

type MatchCriteria = {
  complexity: string;
  category: string;
  language: string;
  timeout: number;
};

enum MatchEvents {
  // Send
  MATCH_REQUEST = "match_request",
  CANCEL_MATCH_REQUEST = "cancel_match_request",
  MATCH_ACCEPT_REQUEST = "match_accept_request",
  MATCH_DECLINE_REQUEST = "match_decline_request",
  REMATCH_REQUEST = "rematch_request",
  MATCH_END_REQUEST = "match_end_request",
  MATCH_STATUS_REQUEST = "match_status_request",

  USER_CONNECTED = "user_connected",
  USER_DISCONNECTED = "user_disconnected",

  // Receive
  MATCH_FOUND = "match_found",
  MATCH_SUCCESSFUL = "match_successful",
  MATCH_UNSUCCESSFUL = "match_unsuccessful",
  MATCH_REQUEST_EXISTS = "match_request_exists",
  MATCH_REQUEST_ERROR = "match_request_error",

  SOCKET_DISCONNECT = "disconnect",
  SOCKET_CLIENT_DISCONNECT = "io client disconnect",
  SOCKET_SERVER_DISCONNECT = "io server disconnect",
  SOCKET_RECONNECT_SUCCESS = "reconnect",
  SOCKET_RECONNECT_FAILED = "reconnect_failed",
}

enum MatchPaths {
  HOME = "/home",
  TIMEOUT = "/matching/timeout",
  MATCHING = "/matching",
  MATCHED = "/matching/matched",
  COLLAB = "/collaboration",
}

type MatchContextType = {
  findMatch: (
    complexity: string,
    category: string,
    language: string,
    timeout: number
  ) => void;
  stopMatch: () => void;
  acceptMatch: () => void;
  rematch: () => void;
  retryMatch: () => void;
  matchingTimeout: () => void;
  matchOfferTimeout: () => void;
  verifyMatchStatus: () => void;
  getMatchId: () => string | null;
  matchUser: MatchUser | null;
  matchCriteria: MatchCriteria | null;
  partner: MatchUser | null;
  matchPending: boolean;
  loading: boolean;
  questionId: string | null;
  qnHistoryId: string | null;
  setQnHistoryId: React.Dispatch<React.SetStateAction<string | null>>;
};

const requestTimeoutDuration = 5000;

const MatchContext = createContext<MatchContextType | null>(null);

const MatchProvider: React.FC<{ children?: React.ReactNode }> = (props) => {
  const { children } = props;
  const appNavigate = useAppNavigate();

  const auth = useAuth();
  if (!auth) {
    throw new Error(USE_AUTH_ERROR_MESSAGE);
  }
  const { user } = auth;

  const [matchUser, setMatchUser] = useState<MatchUser | null>(null);
  const [matchCriteria, setMatchCriteria] = useState<MatchCriteria | null>(
    null
  );
  const [matchId, setMatchId] = useState<string | null>(null);
  const [partner, setPartner] = useState<MatchUser | null>(null);
  const [matchPending, setMatchPending] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [qnHistoryId, setQnHistoryId] = useState<string | null>(null);

  const navigator = useContext(UNSAFE_NavigationContext).navigator as History;

  useEffect(() => {
    if (user) {
      setMatchUser({
        id: user.id,
        username: user.username,
        profile: user.profilePictureUrl,
      });
      matchUserId = user.id;
    } else {
      setMatchUser(null);
      matchUserId = "";
    }
  }, [user]);

  useEffect(() => {
    if (
      !matchUser?.id ||
      (location.pathname !== MatchPaths.MATCHING &&
        location.pathname !== MatchPaths.MATCHED &&
        location.pathname !== MatchPaths.COLLAB)
    ) {
      resetMatchStates();
      return;
    }

    openSocketConnection();
    matchSocket.emit(MatchEvents.USER_CONNECTED, matchUser?.id);

    if (location.pathname === MatchPaths.COLLAB) {
      return;
    }

    const unblock = navigator.block((transition: Transition) => {
      if (
        transition.action === Action.Replace ||
        confirm(ABORT_MATCH_PROCESS_CONFIRMATION_MESSAGE)
      ) {
        unblock();
        appNavigate(transition.location.pathname);
      }
    });

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ABORT_MATCH_PROCESS_CONFIRMATION_MESSAGE; // for legacy support, does not actually display message
    };

    const handleUnload = () => {
      closeSocketConnection();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("unload", handleUnload);

    return () => {
      closeSocketConnection();
      unblock();
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("unload", handleUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchUser?.id, location.pathname]);

  const resetMatchStates = () => {
    if (location.pathname !== MatchPaths.TIMEOUT) {
      setMatchCriteria(null);
    }
    setMatchId(null);
    setPartner(null);
    partnerUserId = "";
    setMatchPending(false);
    setLoading(false);
  };

  const openSocketConnection = () => {
    matchSocket.connect();
    initListeners();
  };

  const closeSocketConnection = () => {
    matchSocket.emit(MatchEvents.USER_DISCONNECTED, matchUser?.id);
    removeListeners();
  };

  const removeListeners = () => {
    matchSocket.removeAllListeners();
    matchSocket.io.removeListener(MatchEvents.SOCKET_RECONNECT_SUCCESS);
    matchSocket.io.removeListener(MatchEvents.SOCKET_RECONNECT_FAILED);
  };

  const initListeners = () => {
    initConnectionStatusListeners();
    switch (location.pathname) {
      case MatchPaths.HOME:
      case MatchPaths.TIMEOUT:
        initMatchRequestListeners();
        return;
      case MatchPaths.MATCHING:
        initMatchingListeners();
        return;
      case MatchPaths.MATCHED:
        initMatchedListeners();
        return;
      default:
        return;
    }
  };

  const initConnectionStatusListeners = () => {
    let connectionLost = false;
    if (!matchSocket.hasListeners(MatchEvents.SOCKET_DISCONNECT)) {
      matchSocket.on(MatchEvents.SOCKET_DISCONNECT, (reason) => {
        if (
          reason !== MatchEvents.SOCKET_CLIENT_DISCONNECT &&
          reason !== MatchEvents.SOCKET_SERVER_DISCONNECT
        ) {
          connectionLost = true;
        }
      });
    }

    if (!matchSocket.io.hasListeners(MatchEvents.SOCKET_RECONNECT_SUCCESS)) {
      matchSocket.io.on(MatchEvents.SOCKET_RECONNECT_SUCCESS, () => {
        if (connectionLost) {
          closeSocketConnection();
          toast.error(MATCH_CONNECTION_ERROR);
          appNavigate(MatchPaths.HOME);
        }
      });
    }

    if (!matchSocket.io.hasListeners(MatchEvents.SOCKET_RECONNECT_FAILED)) {
      matchSocket.io.on(MatchEvents.SOCKET_RECONNECT_FAILED, () => {
        matchSocket.close();
        toast.error(MATCH_CONNECTION_ERROR);
        appNavigate(MatchPaths.HOME);
      });
    }
  };

  const initMatchRequestListeners = () => {
    matchSocket.on(MatchEvents.MATCH_FOUND, ({ matchId, user1, user2 }) => {
      handleMatchFound(matchId, user1, user2);
    });

    matchSocket.on(MatchEvents.MATCH_REQUEST_EXISTS, () => {
      toast.error(MATCH_REQUEST_EXISTS_MESSAGE);
    });

    matchSocket.on(MatchEvents.MATCH_REQUEST_ERROR, () => {
      toast.error(FAILED_MATCH_REQUEST_MESSAGE);
    });
  };

  const initMatchingListeners = () => {
    matchSocket.on(MatchEvents.MATCH_FOUND, ({ matchId, user1, user2 }) => {
      handleMatchFound(matchId, user1, user2);
    });
  };

  const initMatchedListeners = () => {
    matchSocket.on(
      MatchEvents.MATCH_SUCCESSFUL,
      (qnId: string, qnHistId: string) => {
        setMatchPending(false);
        setQuestionId(qnId);
        setQnHistoryId(qnHistId);
        appNavigate(MatchPaths.COLLAB);
      }
    );

    matchSocket.on(MatchEvents.MATCH_UNSUCCESSFUL, () => {
      toast.error(MATCH_UNSUCCESSFUL_MESSAGE);
      setMatchPending(false);
    });

    matchSocket.on(MatchEvents.MATCH_FOUND, ({ matchId, user1, user2 }) => {
      handleMatchFound(matchId, user1, user2);
    });

    matchSocket.on(MatchEvents.MATCH_REQUEST_ERROR, () => {
      toast.error(FAILED_MATCH_REQUEST_MESSAGE);
    });
  };

  const handleMatchFound = (
    matchId: string,
    user1: MatchUser,
    user2: MatchUser
  ) => {
    setMatchId(matchId);
    if (matchUser?.id === user1.id) {
      setPartner(user2);
      partnerUserId = user2.id;
    } else {
      setPartner(user1);
      partnerUserId = user1.id;
    }
    setMatchPending(true);
    appNavigate(MatchPaths.MATCHED);
  };

  const findMatch = (
    complexity: string,
    category: string,
    language: string,
    timeout: number
  ) => {
    if (!matchUser) {
      toast.error(MATCH_LOGIN_REQUIRED_MESSAGE);
      return;
    }

    const requestTimeout = setTimeout(() => {
      setLoading(false);
      toast.error(MATCH_CONNECTION_ERROR);
    }, requestTimeoutDuration);

    setLoading(true);
    openSocketConnection();
    matchSocket.emit(
      MatchEvents.MATCH_REQUEST,
      {
        user: matchUser,
        complexity: complexity,
        category: category,
        language: language,
        timeout: timeout,
      },
      (requested: boolean) => {
        clearTimeout(requestTimeout);
        setTimeout(() => setLoading(false), 500);
        if (requested) {
          setMatchCriteria({
            complexity: complexity,
            category: category,
            language: language,
            timeout,
          });
          appNavigate(MatchPaths.MATCHING);
        } else {
          removeListeners();
        }
      }
    );
  };

  const stopMatch = () => {
    setQuestionId(null);
    switch (location.pathname) {
      case MatchPaths.TIMEOUT:
        appNavigate(MatchPaths.HOME);
        return;
      case MatchPaths.MATCHING:
        matchSocket.emit(MatchEvents.CANCEL_MATCH_REQUEST, matchUser?.id);
        appNavigate(MatchPaths.HOME);
        return;
      case MatchPaths.MATCHED:
        matchSocket.emit(
          MatchEvents.MATCH_DECLINE_REQUEST,
          matchUser?.id,
          matchId,
          false
        );
        appNavigate(MatchPaths.HOME);
        return;
      case MatchPaths.COLLAB:
        matchSocket.emit(MatchEvents.MATCH_END_REQUEST, matchUser?.id, matchId);
        return;
      default:
        return;
    }
  };

  const acceptMatch = () => {
    matchSocket.emit(
      MatchEvents.MATCH_ACCEPT_REQUEST,
      matchId,
      matchUserId,
      partnerUserId
    );
  };

  const rematch = () => {
    if (!matchCriteria) {
      toast.error(FAILED_MATCH_REQUEST_MESSAGE);
      return;
    }

    const requestTimeout = setTimeout(() => {
      setLoading(false);
      toast.error(MATCH_CONNECTION_ERROR);
    }, requestTimeoutDuration);

    setLoading(true);
    setMatchPending(false);

    const rematchRequest = {
      user: matchUser,
      complexities: matchCriteria.complexity,
      categories: matchCriteria.category,
      languages: matchCriteria.language,
      timeout: matchCriteria.timeout,
    };
    matchSocket.emit(
      MatchEvents.REMATCH_REQUEST,
      matchId,
      partner?.id,
      rematchRequest,
      (requested: boolean) => {
        clearTimeout(requestTimeout);
        setTimeout(() => setLoading(false), 500);
        if (requested) {
          appNavigate(MatchPaths.MATCHING);
          setPartner(null);
          partnerUserId = "";
        }
      }
    );
  };

  const retryMatch = () => {
    if (!matchCriteria) {
      toast.error(FAILED_MATCH_REQUEST_MESSAGE);
      return;
    }

    findMatch(
      matchCriteria.complexity,
      matchCriteria.category,
      matchCriteria.language,
      matchCriteria.timeout
    );
  };

  const matchingTimeout = () => {
    matchSocket.emit(MatchEvents.CANCEL_MATCH_REQUEST, matchUser?.id);
    appNavigate(MatchPaths.TIMEOUT);
  };

  const matchOfferTimeout = () => {
    matchSocket.emit(
      MatchEvents.MATCH_DECLINE_REQUEST,
      matchUser?.id,
      matchId,
      true
    );
    appNavigate(MatchPaths.HOME);
  };

  const verifyMatchStatus = () => {
    const requestTimeout = setTimeout(() => {
      setLoading(false);
      toast.error(MATCH_CONNECTION_ERROR);
    }, requestTimeoutDuration);

    setLoading(true);
    matchSocket.emit(
      MatchEvents.MATCH_STATUS_REQUEST,
      matchUser?.id,
      (match: { matchId: string; partner: MatchUser } | null) => {
        clearTimeout(requestTimeout);
        if (match) {
          setMatchId(match.matchId);
          setPartner(match.partner);
          partnerUserId = match.partner.id;
        } else {
          setMatchId(null);
          setPartner(null);
          partnerUserId = "";
        }
        setLoading(false);
      }
    );
  };

  const getMatchId = () => {
    return matchId;
  };

  return (
    <MatchContext.Provider
      value={{
        findMatch,
        stopMatch,
        acceptMatch,
        rematch,
        retryMatch,
        matchingTimeout,
        matchOfferTimeout,
        verifyMatchStatus,
        getMatchId,
        matchUser,
        matchCriteria,
        partner,
        matchPending,
        loading,
        questionId,
        qnHistoryId,
        setQnHistoryId,
      }}
    >
      {children}
    </MatchContext.Provider>
  );
};

export const useMatch = () => useContext(MatchContext);

export default MatchProvider;
