import { Button, Stack } from "@mui/material";
import Stopwatch from "../Stopwatch";
import { useCollab } from "../../contexts/CollabContext";
import { USE_COLLAB_ERROR_MESSAGE } from "../../utils/constants";

const CollabSessionControls: React.FC = () => {
  const collab = useCollab();
  if (!collab) {
    throw new Error(USE_COLLAB_ERROR_MESSAGE);
  }

  const { handleSubmitSessionClick, handleEndSessionClick, time } = collab;

  return (
    <Stack direction={"row"} alignItems={"center"} spacing={2}>
      <Stopwatch time={time} />
      <Button
        sx={{
          border: 1.5,
          borderRadius: 4,
        }}
        variant="outlined"
        color="success"
        onClick={() => handleSubmitSessionClick()}
      >
        Submit
      </Button>
      <Button
        sx={{
          border: 1.5,
          borderRadius: 4,
        }}
        variant="outlined"
        color="error"
        onClick={() => {
          handleEndSessionClick();
        }}
      >
        End Session
      </Button>
    </Stack>
  );
};

export default CollabSessionControls;
