import { Box, styled, Typography } from "@mui/material";
import { CompilerResult } from "../../contexts/CollabContext";

type TestCaseProps = {
  input: string;
  expected: string;
  result: CompilerResult;
};

const StyledBox = styled(Box)(({ theme }) => ({
  margin: theme.spacing(2, 0),
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
  background: theme.palette.divider,
  padding: theme.spacing(1, 2),
  borderRadius: theme.spacing(1),
  whiteSpace: "pre-line",
}));

const TestCase: React.FC<TestCaseProps> = ({ input, expected, result }) => {
  return (
    <Box>
      {"isMatch" in result && result.isMatch && (
        <StyledBox>
          <Typography variant="h4" color="success">
            Accepted
          </Typography>
        </StyledBox>
      )}
      {"isMatch" in result && !result.isMatch && (
        <StyledBox>
          <Typography variant="h4" color="error">
            Wrong Answer
          </Typography>
        </StyledBox>
      )}
      {result.stderr && (
        <StyledBox>
          <Typography variant="overline">Error</Typography>
          <StyledTypography
            fontFamily={"monospace"}
            sx={{ backgroundColor: "#EDAFAF" }}
          >
            {result.stderr}
          </StyledTypography>
        </StyledBox>
      )}
      <StyledBox>
        <Typography variant="overline">Input</Typography>
        <StyledTypography fontFamily={"monospace"}>{input}</StyledTypography>
      </StyledBox>
      <StyledBox>
        <Typography variant="overline">Expected</Typography>
        <StyledTypography fontFamily={"monospace"}>{expected}</StyledTypography>
      </StyledBox>
      {"actualResult" in result && (
        <StyledBox>
          <Typography variant="overline">Actual</Typography>
          <StyledTypography fontFamily={"monospace"}>
            {result.actualResult || "\u00A0"}
          </StyledTypography>
        </StyledBox>
      )}
      {"stdout" in result && (
        <StyledBox>
          <Typography variant="overline">Stdout</Typography>
          <StyledTypography fontFamily={"monospace"}>
            {result.stdout || "\u00A0"}
          </StyledTypography>
        </StyledBox>
      )}
    </Box>
  );
};

export default TestCase;
