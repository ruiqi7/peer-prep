import { HelpOutlined } from "@mui/icons-material";
import {
  Box,
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { CODE_TEMPLATES_TOOLTIP_MESSAGE } from "../../utils/constants";

interface QuestionCodeTemplatesProps {
  codeTemplates: {
    [key: string]: string;
  };
  setCodeTemplates: React.Dispatch<
    React.SetStateAction<{
      [key: string]: string;
    }>
  >;
}

const QuestionCodeTemplates: React.FC<QuestionCodeTemplatesProps> = ({
  codeTemplates,
  setCodeTemplates,
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>("python");

  const handleLanguageChange = (
    _: React.MouseEvent<HTMLElement>,
    language: string
  ) => {
    if (language) {
      setSelectedLanguage(language);
    }
  };

  const handleCodeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setCodeTemplates((prevTemplates) => ({
      ...prevTemplates,
      [selectedLanguage]: value,
    }));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleTabKeys = (event: any) => {
    const { value } = event.target;

    if (event.key === "Tab") {
      event.preventDefault();

      const cursorPosition = event.target.selectionStart;
      const cursorEndPosition = event.target.selectionEnd;
      const tab = "\t";

      event.target.value =
        value.substring(0, cursorPosition) +
        tab +
        value.substring(cursorEndPosition);

      event.target.selectionStart = cursorPosition + 1;
      event.target.selectionEnd = cursorPosition + 1;
    }
  };

  return (
    <Box display="flex" flexDirection="column" marginTop={2}>
      <Stack direction="row" alignItems="center">
        <Typography variant="h6">Code Templates</Typography>
        <Tooltip
          title={
            <Typography variant="body2">
              <span
                dangerouslySetInnerHTML={{
                  __html: CODE_TEMPLATES_TOOLTIP_MESSAGE,
                }}
              />
            </Typography>
          }
          placement="right"
          arrow
        >
          <IconButton>
            <HelpOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
      <ToggleButtonGroup
        value={selectedLanguage}
        exclusive
        onChange={handleLanguageChange}
        sx={{
          marginY: 2,
          height: 42,
        }}
        fullWidth
      >
        <ToggleButton value="python">Python</ToggleButton>
        <ToggleButton value="java">Java</ToggleButton>
        <ToggleButton value="c">C</ToggleButton>
      </ToggleButtonGroup>

      <TextField
        label={
          codeTemplates[selectedLanguage]
            ? ``
            : `${
                selectedLanguage.charAt(0).toUpperCase() +
                selectedLanguage.slice(1)
              } Code Template`
        }
        variant="outlined"
        multiline
        rows={8}
        sx={{
          "& .MuiOutlinedInput-root": {
            fontFamily: "monospace",
          },
        }}
        value={codeTemplates[selectedLanguage]}
        onChange={handleCodeChange}
        onKeyDown={handleTabKeys}
        fullWidth
      />
    </Box>
  );
};

export default QuestionCodeTemplates;
