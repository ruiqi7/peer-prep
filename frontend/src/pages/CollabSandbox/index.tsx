import AppMargin from "../../components/AppMargin";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid2,
  Tab,
  Tabs,
} from "@mui/material";
import classes from "./index.module.css";
import { useCollab } from "../../contexts/CollabContext";
import { useMatch } from "../../contexts/MatchContext";
import {
  COLLAB_CONNECTION_ERROR,
  USE_COLLAB_ERROR_MESSAGE,
  USE_MATCH_ERROR_MESSAGE,
} from "../../utils/constants";
import { useEffect, useReducer, useState } from "react";
import Loader from "../../components/Loader";
import reducer, {
  getQuestionById,
  initialState,
} from "../../reducers/questionReducer";
import QuestionDetailComponent from "../../components/QuestionDetail";
import { Navigate } from "react-router-dom";
import Chat from "../../components/Chat";
import TabPanel from "../../components/TabPanel";
import TestCase from "../../components/TestCase";
import CodeEditor from "../../components/CodeEditor";
import { CollabSessionData, join, leave } from "../../utils/collabSocket";
import { toast } from "react-toastify";

const CollabSandbox: React.FC = () => {
  const [editorState, setEditorState] = useState<CollabSessionData | null>(
    null
  );
  const [isConnecting, setIsConnecting] = useState<boolean>(true);

  const match = useMatch();
  if (!match) {
    throw new Error(USE_MATCH_ERROR_MESSAGE);
  }

  const {
    // verifyMatchStatus,
    getMatchId,
    matchUser,
    matchCriteria,
    loading,
    questionId,
  } = match;

  const collab = useCollab();
  if (!collab) {
    throw new Error(USE_COLLAB_ERROR_MESSAGE);
  }

  const {
    handleRejectEndSession,
    handleConfirmEndSession,
    checkPartnerStatus,
    isEndSessionModalOpen,
  } = collab;

  const [state, dispatch] = useReducer(reducer, initialState);
  const { selectedQuestion } = state;
  const [selectedTab, setSelectedTab] = useState<"tests" | "chat">("tests");
  const [selectedTestcase, setSelectedTestcase] = useState(0);

  useEffect(() => {
    // TODO: Retain session on page refresh
    // verifyMatchStatus();

    if (!questionId) {
      return;
    }
    getQuestionById(questionId, dispatch);

    const matchId = getMatchId();
    if (!matchUser || !matchId) {
      return;
    }

    const connectToCollabSession = async () => {
      try {
        const editorState = await join(matchUser.id, matchId);
        if (editorState.ready) {
          setEditorState(editorState);
          checkPartnerStatus();
        } else {
          toast.error(COLLAB_CONNECTION_ERROR);
          setIsConnecting(false);
        }
      } catch (error) {
        toast.error(COLLAB_CONNECTION_ERROR);
        setIsConnecting(false);
      }
    };

    connectToCollabSession();

    // handle page refresh / tab closure
    const handleUnload = () => leave(matchUser.id, matchId);
    window.addEventListener("unload", handleUnload);

    return () => {
      leave(matchUser.id, matchId);
      window.removeEventListener("unload", handleUnload);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <Loader />;
  }

  if (!matchUser || !matchCriteria || !getMatchId() || !isConnecting) {
    return <Navigate to="/home" replace />;
  }

  if (!selectedQuestion || !editorState) {
    return <Loader />;
  }

  return (
    <AppMargin classname={`${classes.fullheight} ${classes.flex}`}>
      <Dialog
        sx={{
          "& .MuiDialog-paper": {
            padding: "20px",
          },
        }}
        open={isEndSessionModalOpen}
        onClose={handleRejectEndSession}
      >
        <DialogTitle sx={{ textAlign: "center", fontSize: 20 }}>
          {"End Session?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ textAlign: "center", fontSize: 16 }}>
            Are you sure you want to end session?
            <br />
            You will lose your current progress.
          </DialogContentText>
        </DialogContent>
        <DialogActions
          sx={{
            justifyContent: "center",
            paddingBottom: "20px",
          }}
        >
          <Button
            sx={{
              width: "250px",
            }}
            variant="contained"
            color="secondary"
            onClick={handleRejectEndSession}
          >
            Back
          </Button>
          <Button
            sx={{
              width: "250px",
            }}
            variant="contained"
            onClick={handleConfirmEndSession}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      <Grid2 container sx={{ flexGrow: 1 }} spacing={4}>
        <Grid2 sx={{ flexGrow: 1 }} size={6}>
          <QuestionDetailComponent
            title={selectedQuestion.title}
            description={selectedQuestion.description}
            complexity={selectedQuestion.complexity}
            categories={selectedQuestion.categories}
          />
        </Grid2>
        <Grid2
          sx={{
            display: "flex",
            flexDirection: "column",
            maxHeight: "100%",
          }}
          size={6}
        >
          <Box
            sx={(theme) => ({
              flex: 1,
              width: "100%",
              minHeight: "44vh",
              maxHeight: "44vh",
              paddingTop: theme.spacing(1),
            })}
          >
            <CodeEditor
              editorState={editorState}
              uid={matchUser.id}
              username={matchUser.username}
              language={matchCriteria.language}
              template={
                matchCriteria.language === "Python"
                  ? selectedQuestion.pythonTemplate
                  : matchCriteria.language === "Java"
                  ? selectedQuestion.javaTemplate
                  : matchCriteria.language === "C"
                  ? selectedQuestion.cTemplate
                  : ""
              }
              roomId={getMatchId()!}
            />
          </Box>
          <Box
            sx={(theme) => ({
              flex: 1,
              maxHeight: "44vh",
              display: "flex",
              flexDirection: "column",
              paddingTop: theme.spacing(1),
            })}
          >
            <Tabs
              value={selectedTab}
              onChange={(_, value) => setSelectedTab(value)}
              sx={(theme) => ({
                position: "sticky",
                top: 0,
                zIndex: 10,
                background: "white",
                borderBottom: `1px solid ${theme.palette.divider}`,
              })}
            >
              <Tab label="Test Cases" value="tests" />
              <Tab label="Chat" value="chat" />
            </Tabs>

            <TabPanel value={selectedTab} selected="tests">
              <Box sx={(theme) => ({ margin: theme.spacing(2, 0) })}>
                {[...Array(selectedQuestion.inputs.length)]
                  .map((_, index) => index + 1)
                  .map((i) => (
                    <Button
                      key={i}
                      variant="contained"
                      color={
                        selectedTestcase === i - 1 ? "primary" : "secondary"
                      }
                      onClick={() => setSelectedTestcase(i - 1)}
                      sx={(theme) => ({ margin: theme.spacing(0, 1) })}
                    >
                      Testcase {i}
                    </Button>
                  ))}
              </Box>
              {/* display result of each test case in the output (result) and stdout (any print statements executed) */}
              <TestCase
                input={selectedQuestion.inputs[selectedTestcase]}
                output={""}
                stdout={""}
                result={selectedQuestion.outputs[selectedTestcase]}
              />
            </TabPanel>
            <TabPanel value={selectedTab} selected="chat">
              <Chat isActive={selectedTab === "chat"} />
            </TabPanel>
          </Box>
        </Grid2>
      </Grid2>
    </AppMargin>
  );
};

export default CollabSandbox;
