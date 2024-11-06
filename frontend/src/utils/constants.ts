/* Dropdowns */
export const complexityList: string[] = ["Easy", "Medium", "Hard"];
export const languageList = ["Python", "Java", "C"];

/* Context Provider Errors */
export const USE_AUTH_ERROR_MESSAGE =
  "useAuth() must be used within AuthProvider";
export const USE_PROFILE_ERROR_MESSAGE =
  "useProfile() must be used within ProfileContextProvider";
export const USE_MATCH_ERROR_MESSAGE =
  "useMatch() must be used within MatchProvider";
export const USE_COLLAB_ERROR_MESSAGE =
  "useCollab() must be used within CollabProvider";

/* Name Validation */
export const NAME_REQUIRED_ERROR_MESSAGE = "Name is required";
export const NAME_MAX_LENGTH_ERROR_MESSAGE =
  "Name must be at most 50 characters long";
export const NAME_ALLOWED_CHAR_ERROR_MESSAGE =
  "Name must contain only alphabetical, hyphen and white space characters";

/* Username Validation */
export const USERNAME_LENGTH_ERROR_MESSAGE =
  "Username must be between 6 and 30 characters long";
export const USERNAME_ALLOWED_CHAR_ERROR_MESSAGE =
  "Username must contain only alphanumeric, underscore and full stop characters";

/* Email Validation */
export const EMAIL_REQUIRED_ERROR_MESSAGE = "Email is required";
export const EMAIL_INVALID_ERROR_MESSAGE = "Email is invalid";

/* Biography Validation */
export const BIO_MAX_LENGTH_ERROR_MESSAGE =
  "Biography must be at most 255 characters long";

/* Profile Picture Validation */
export const PROFILE_PIC_MAX_SIZE_ERROR_MESSAGE =
  "*Profile picture file size should be no more than 5MB";

/* Password Validation */
export const PASSWORD_REQUIRED_ERROR_MESSAGE = "Password is required";
export const PASSWORD_MIN_LENGTH_ERROR_MESSAGE =
  "Password must be at least 8 characters long";
export const PASSWORD_LOWER_CASE_ERROR_MESSAGE =
  "Password must contain at least 1 lowercase letter";
export const PASSWORD_UPPER_CASE_ERROR_MESSAGE =
  "Password must contain at least 1 uppercase letter";
export const PASSWORD_DIGIT_ERROR_MESSAGE =
  "Password must contain at least 1 digit";
export const PASSWORD_SPECIAL_CHAR_ERROR_MESSAGE =
  "Password must contain at least 1 special character";
export const PASSWORD_WEAK_ERROR_MESSAGE = "Password is weak";
export const PASSWORD_MISMATCH_ERROR_MESSAGE = "Password does not match";

/* Token Validation */
export const TOKEN_REQUIRED_ERROR_MESSAGE = "Token is required";

/* Toast Messages */
// Authentication
export const SUCCESS_LOG_OUT = "Logged out successfully!";
export const SUCCESSFUL_SIGNUP =
  "User created successfully. Please verify your email address.";

// Field Validation
export const FILL_ALL_FIELDS = "Please fill in all fields";

export const minMatchTimeout = 30;
export const maxMatchTimeout = 300;

// Question
export const SUCCESS_QUESTION_CREATE = "Question created successfully";
export const FAILED_QUESTION_CREATE = "Failed to create question";
export const NO_QUESTION_CHANGES =
  "You have not made any changes to the question";
export const SUCCESS_QUESTION_UPDATE = "Question updated successfully";
export const FAILED_QUESTION_UPDATE = "Failed to update question";
export const SUCCESS_QUESTION_DELETE = "Question deleted successfully";
export const FAILED_QUESTION_DELETE = "Failed to delete question";
export const SUCCESS_FILE_UPLOAD = "File uploaded successfully";
export const FAILED_FILE_UPLOAD = "Failed to upload file";

// Profile
export const SUCCESS_PW_UPDATE_MESSAGE = "Password updated successfully";
export const FAILED_PW_UPDATE_MESSAGE = "Failed to update password";
export const SUCCESS_PROFILE_UPDATE_MESSAGE = "Profile updated successfully";
export const FAILED_PROFILE_UPDATE_MESSAGE = "Failed to update profile";

// Match
export const MATCH_REQUEST_EXISTS_MESSAGE =
  "You can only have 1 match at a time!";
export const FAILED_MATCH_REQUEST_MESSAGE =
  "Failed to send match request! Please try again from the home page.";
export const MATCH_UNSUCCESSFUL_MESSAGE =
  "Unfortunately, your partner did not accept the match.";
export const MATCH_LOGIN_REQUIRED_MESSAGE =
  "Please login first to find a match.";
export const MATCH_OFFER_TIMEOUT_MESSAGE = "Match offer timeout!";
export const MATCH_CONNECTION_ERROR =
  "Connection error! Please try again later.";
export const QUESTION_DOES_NOT_EXIST_ERROR =
  "There are no questions with the specified complexity and category. Please try another combination.";

// Collab
export const COLLAB_ENDED_MESSAGE =
  "Your partner has left the collaboration session.";
export const COLLAB_PARTNER_DISCONNECTED_MESSAGE =
  "Your partner has disconnected from the collaboration session! You won't be able to make edits until they rejoin.";
export const COLLAB_PARTNER_RECONNECTED_MESSAGE =
  "Your partner has reconnected!";
export const COLLAB_CONNECTION_ERROR =
  "Error connecting you to the collaboration session! Please try again.";

// Code execution
export const FAILED_TESTCASE_MESSAGE =
  "Your code did not pass all the test cases.";
export const SUCCESS_TESTCASE_MESSAGE =
  "You have successfully solved the question!";
export const FAILED_TO_SUBMIT_CODE_MESSAGE =
  "Unable to submit code. Please try again later.";

/* Alerts & Dialog Boxes */
// Questions
export const ABORT_CREATE_OR_EDIT_QUESTION_CONFIRMATION_MESSAGE =
  "Are you sure you want to leave this page? All process will be lost.";

// Match
export const ABORT_MATCH_PROCESS_CONFIRMATION_MESSAGE =
  "Are you sure you want to leave the matching process?";

// Collab
export const ABORT_COLLAB_SESSION_CONFIRMATION_MESSAGE =
  "Are you sure you want to leave the collaboration session?";

/* Image paths */
export const FIND_MATCH_FORM_PATH = "/find_match_form.png";
export const MATCH_FOUND_PATH = "/match_found.png";
export const QUESTIONS_LIST_PATH = "/questions_list.png";
export const COLLABORATIVE_EDITOR_PATH = "/collaborative_editor.png";

/* Tooltips */
export const ADD_QUESTION_TEST_CASE_TOOLTIP_MESSAGE = `Add at least 1 and at most 3 test cases. <br /> This will be displayed to users.`;
export const ADD_TEST_CASE_FILES_TOOLTIP_MESSAGE = `
  Upload files for executing test cases when the user submits code. <br /><br />
  This is a required field. Only text files are accepted. <br /><br />
  Please ensure that each test case in the file is <u>separated by a double newline</u>. <br /><br />
  For example, if the question is "Two Sum", an input file with 2 test cases could look like:<br />
  """
  <br />2 7 11 15<br />9<br /><br />3 2 4<br />6<br />
  """<br /><br />
  The first line of each test case is the input array, while the second line is the target value. <br /><br />
  The corresponding output file, with each result in a single line, should look like:<br />
  """
  <br />0 1<br /><br />1 2<br />
  """<br /><br />
  Each line in the output file represents the indices of the two numbers that add up to the target for each respective test case.
`;
export const CODE_TEMPLATES_TOOLTIP_MESSAGE = `This is a required field. <br /> Fill in a code template for each language.`;

/* Code Templates */
export const PYTHON_CODE_TEMPLATE = `# Please do not modify the main function\ndef main():\n\tprint(convert_to_string_format(solution()))\n\n\n# Write your code here\ndef solution():\n\treturn None\n\n\nif __name__ == "__main__":\n\tmain()\n`;
export const JAVA_CODE_TEMPLATE = `public class Main {\n\t// Please do not modify the main function\n\tpublic static void main(String[] args) {\n\t\tSystem.out.println(convert_to_string_format(solution()));\n\t}\n\n\t// Write your code here and return the appropriate type\n\tpublic static String solution() {\n\t\treturn null;\n\t}\n}\n`;
export const C_CODE_TEMPLATE = `#include <stdio.h>\n\n// Write your code here and return the appropriate type\nconst char* solution() {\n\treturn "";\n}\n\n// Please do not modify the main function\nint main() {\n\tprintf("%s\\n", convert_to_string_format(solution()));\n\treturn 0;\n}\n`;
