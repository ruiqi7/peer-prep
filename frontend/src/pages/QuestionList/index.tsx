import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Grid2,
  IconButton,
  InputAdornment,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useReducer, useState } from "react";
import AppMargin from "../../components/AppMargin";
import { useNavigate } from "react-router-dom";
import reducer, {
  deleteQuestionById,
  getQuestionCategories,
  getQuestionList,
  initialState,
} from "../../reducers/questionReducer";
import {
  complexityList,
  FAILED_QUESTION_DELETE,
  SUCCESS_QUESTION_DELETE,
  USE_AUTH_ERROR_MESSAGE,
} from "../../utils/constants";
import useDebounce from "../../hooks/useDebounce";
import { blue, grey } from "@mui/material/colors";
import { Add, Delete, Edit, MoreVert, Search } from "@mui/icons-material";
import ConfirmationDialog from "../../components/ConfirmationDialog";
import ServerError from "../../components/ServerError";
import { toast } from "react-toastify";
import { useAuth } from "../../contexts/AuthContext";

const tableHeaders = ["Title", "Complexity", "Categories"];
const searchCharacterLimit = 255;
const categorySelectionLimit = 10;
const rowsPerPage = 10;

const QuestionList: React.FC = () => {
  const [page, setPage] = useState<number>(0);
  const [searchInput, setSearchInput] = useState<string>("");
  const [searchFilter, setSearchFilter] = useDebounce<string>("", 1000);
  const [complexityFilter, setComplexityFilter] = useDebounce<string[]>(
    [],
    1000
  );
  const [categoryFilter, setCategoryFilter] = useDebounce<string[]>([], 1000);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [state, dispatch] = useReducer(reducer, initialState);
  const navigate = useNavigate();

  const areQuestionsFiltered = () => {
    return (
      searchFilter || complexityFilter.length > 0 || categoryFilter.length > 0
    );
  };

  const updateQuestionList = () => {
    getQuestionList(
      page + 1, // convert from 0-based indexing
      rowsPerPage,
      searchFilter,
      complexityFilter,
      categoryFilter,
      dispatch
    );
  };

  // For handling edit / delete menu
  const [targetQuestion, setTargetQuestion] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const menuOpen = Boolean(menuAnchor);
  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    questionId: string
  ) => {
    setMenuAnchor(event.currentTarget);
    setTargetQuestion(questionId);
  };
  const handleMenuClose = () => {
    setMenuAnchor(null);
    setTargetQuestion(null);
  };

  // For handling question delete
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const handleQuestionDelete = () => {
    setMenuAnchor(null);
    setDialogOpen(true);
  };
  const handleDialogClose = () => {
    setDialogOpen(false);
  };
  const deleteQuestion = async () => {
    handleDialogClose();

    if (!targetQuestion) {
      return;
    }

    const result = await deleteQuestionById(targetQuestion);
    if (!result) {
      toast.error(FAILED_QUESTION_DELETE);
      return;
    }

    toast.success(SUCCESS_QUESTION_DELETE);
    getQuestionCategories(dispatch);
    if (state.questionCount % rowsPerPage !== 1 || page === 0) {
      updateQuestionList();
    } else {
      setPage((page) => page - 1);
    }
  };

  useEffect(() => {
    getQuestionCategories(dispatch);
  }, []);

  useEffect(() => {
    if (page !== 0) {
      setPage(0);
    } else {
      updateQuestionList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchFilter, complexityFilter, categoryFilter]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => updateQuestionList(), [page]);

  // Check if the user is admin
  const auth = useAuth();
  if (!auth) {
    throw new Error(USE_AUTH_ERROR_MESSAGE);
  }
  const { user } = auth;
  const isAdmin = user && user.isAdmin;

  if (state.questionCategoriesError || state.selectedQuestionError) {
    return (
      <ServerError
        title="Sorry, something went wrong..."
        subtitle="Please refresh the page or try again later!"
      />
    );
  }

  return (
    <AppMargin>
      <Box
        sx={(theme) => ({
          marginTop: theme.spacing(4),
          marginBottom: theme.spacing(4),
        })}
      >
        <Stack
          direction="row"
          sx={{ justifyContent: "space-between", alignItems: "center" }}
        >
          <Typography component="h1" variant="h3">
            Questions
          </Typography>
          {isAdmin && (
            <Button
              variant="contained"
              disableElevation
              startIcon={<Add />}
              sx={{ height: 40 }}
              onClick={() => navigate("new")}
            >
              Create
            </Button>
          )}
        </Stack>
        <Grid2
          container
          rowSpacing={1}
          columnSpacing={2}
          sx={(theme) => ({
            marginTop: theme.spacing(2),
            "& .MuiTextField-root": { width: "100%" },
          })}
        >
          <Grid2 size={12}>
            <TextField
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton type="button">
                        <Search />
                      </IconButton>
                    </InputAdornment>
                  ),
                },
                htmlInput: {
                  maxLength: searchCharacterLimit,
                },
                formHelperText: {
                  sx: { textAlign: "right" },
                },
              }}
              label="Title"
              onChange={(input) => {
                setSearchInput(input.target.value);
                setSearchFilter(input.target.value.toLowerCase().trim());
              }}
              helperText={
                searchInput.length + ` / ${searchCharacterLimit} characters`
              }
              disabled={state.questions.length === 0 && !areQuestionsFiltered()}
            />
          </Grid2>
          <Grid2 size={4}>
            <Autocomplete
              multiple
              disableCloseOnSelect
              options={complexityList}
              onChange={(_, selectedOptions) => {
                setComplexityFilter(selectedOptions);
              }}
              renderInput={(params) => (
                <TextField {...params} label="Complexity" />
              )}
              disabled={state.questions.length === 0 && !areQuestionsFiltered()}
            />
          </Grid2>
          <Grid2 size={8}>
            <Autocomplete
              multiple
              disableCloseOnSelect
              options={state.questionCategories}
              getOptionDisabled={(option) =>
                selectedCategories.length > categorySelectionLimit &&
                !selectedCategories.includes(option as string)
              }
              onChange={(_, selectedOptions) => {
                setSelectedCategories(selectedOptions);
                setCategoryFilter(selectedOptions);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Category"
                  helperText={
                    selectedCategories.length +
                    ` / ${categorySelectionLimit} selections`
                  }
                  slotProps={{
                    formHelperText: {
                      sx: { textAlign: "right" },
                    },
                  }}
                />
              )}
              disabled={state.questions.length === 0 && !areQuestionsFiltered()}
            />
          </Grid2>
        </Grid2>
        <TableContainer>
          <Table
            sx={(theme) => ({
              "& .MuiTableCell-root": { padding: theme.spacing(1.2) },
              whiteSpace: "nowrap",
            })}
          >
            <TableHead>
              <TableRow>
                {tableHeaders.map((header) => (
                  <TableCell key={header}>
                    <Typography component="span" variant="h5">
                      {header}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {state.questions.slice(0, rowsPerPage).map((question) => (
                <TableRow key={question.id}>
                  <TableCell
                    sx={{
                      width: "50%",
                      maxWidth: "250px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    <Typography
                      component="span"
                      sx={{
                        "&:hover": { cursor: "pointer", color: "primary.main" },
                      }}
                      onClick={() => navigate(`${question.id}`)}
                    >
                      {question.title}
                    </Typography>
                  </TableCell>
                  <TableCell
                    sx={{
                      borderLeft: "1px solid #E0E0E0",
                      borderRight: "1px solid #E0E0E0",
                    }}
                  >
                    <Typography
                      component="span"
                      sx={{
                        color:
                          question.complexity === "Easy"
                            ? "success.main"
                            : question.complexity === "Medium"
                            ? "#D2C350"
                            : question.complexity === "Hard"
                            ? "error.main"
                            : grey[500],
                      }}
                    >
                      {question.complexity}
                    </Typography>
                  </TableCell>
                  <TableCell
                    sx={{
                      width: "50%",
                      maxWidth: "250px",
                      overflow: "auto",
                    }}
                  >
                    <Stack direction="row">
                      {question.categories.map((category) => (
                        <Chip
                          key={category}
                          label={category}
                          color="primary"
                          sx={(theme) => ({
                            marginLeft: theme.spacing(0.5),
                            marginRight: theme.spacing(0.5),
                          })}
                        />
                      ))}
                      <Chip
                        sx={(theme) => ({
                          visibility: "hidden",
                          width: theme.spacing(0.5),
                        })}
                      />
                    </Stack>
                  </TableCell>
                  {isAdmin && (
                    <TableCell sx={{ borderTop: "1px solid #E0E0E0" }}>
                      <IconButton
                        data-testid="edit-delete-menu"
                        type="button"
                        onClick={(event) => handleMenuOpen(event, question.id)}
                      >
                        <MoreVert />
                      </IconButton>
                      <Menu
                        anchorEl={menuAnchor}
                        open={menuOpen}
                        onClose={handleMenuClose}
                        sx={{
                          "& .MuiPaper-root": {
                            boxShadow: "0px 3px 5px rgba(0, 0, 0, 0.2)",
                          },
                        }}
                      >
                        <MenuItem
                          onClick={() => navigate(`${targetQuestion}/edit`)}
                        >
                          <ListItemIcon>
                            <Edit
                              sx={{ fontSize: "large", color: blue[800] }}
                            />
                          </ListItemIcon>
                          Edit
                        </MenuItem>
                        <MenuItem onClick={handleQuestionDelete}>
                          <ListItemIcon>
                            <Delete
                              sx={{ fontSize: "large", color: "error.main" }}
                            />
                          </ListItemIcon>
                          Delete
                        </MenuItem>
                      </Menu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              <ConfirmationDialog
                titleText="Delete question?"
                bodyText="This question will be permanently deleted from the repository."
                primaryAction="Delete"
                handlePrimaryAction={() => deleteQuestion()}
                open={dialogOpen}
                handleClose={handleDialogClose}
              />
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[rowsPerPage]}
          component="div"
          count={state.questionCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, page) => setPage(page)}
        />
        {state.questions.length === 0 && !areQuestionsFiltered() && (
          <Stack
            direction="column"
            spacing={1}
            sx={{ alignItems: "center", fontStyle: "italic" }}
          >
            <Typography>
              Unfortunately, there are no questions available now.
            </Typography>
            <Typography>
              {isAdmin
                ? "Create questions using the 'Create' button above."
                : "Please try again later!"}
            </Typography>
          </Stack>
        )}
      </Box>
    </AppMargin>
  );
};

export default QuestionList;
