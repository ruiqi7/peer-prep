import { Request, Response } from "express";
import { oneCompilerApi } from "../utils/oneCompilerApi";
import {
  SUPPORTED_LANGUAGES,
  ERROR_MISSING_REQUIRED_FIELDS_MESSAGE,
  ERROR_UNSUPPORTED_LANGUAGE_MESSAGE,
  ERROR_FAILED_TO_EXECUTE_MESSAGE,
  ERROR_NOT_SAME_LENGTH_MESSAGE,
  SUCCESS_MESSAGE,
  ERROR_INVALID_TEST_CASES_MESSAGE,
} from "../utils/constants";
import { questionService } from "../utils/questionApi";

interface CompilerResult {
  status: string;
  exception: string | null;
  stdout: string;
  stderr: string | null;
  executionTime: number;
  stdin: string;
}

export const executeCode = async (req: Request, res: Response) => {
  const { questionId, language, code } = req.body;

  if (!language || !code || !questionId) {
    res.status(400).json({
      message: ERROR_MISSING_REQUIRED_FIELDS_MESSAGE,
    });
    return;
  }

  if (!SUPPORTED_LANGUAGES.includes(language)) {
    res.status(400).json({
      message: ERROR_UNSUPPORTED_LANGUAGE_MESSAGE,
    });
    return;
  }

  try {
    // Get question test case files
    const qnsResponse = await questionService.get(`/${questionId}`);
    const { inputs: stdinList, outputs: expectedResultList } =
      qnsResponse.data.question;

    if (stdinList.length !== expectedResultList.length) {
      res.status(400).json({
        message: ERROR_NOT_SAME_LENGTH_MESSAGE,
      });
      return;
    }

    if (stdinList.length === 0) {
      res.status(400).json({
        message: ERROR_INVALID_TEST_CASES_MESSAGE,
      });
      return;
    }

    // Execute code for each test case
    const compilerResponse = await oneCompilerApi(language, stdinList, code);

    const compilerData = (compilerResponse.data as CompilerResult[]).map(
      (result, index) => {
        let { stdout, ...restofResult } = result; // eslint-disable-line
        const expectedResultValue = expectedResultList[index].trim();

        if (!stdout) {
          stdout = "";
        }

        let resultValue = "";
        if (restofResult.stderr) {
          resultValue = "";
          stdout = stdout.trim();
        } else {
          // Extract the last line as the result value and the rest as stdout only if there is no error
          const lines = stdout.trim().split("\n");
          resultValue = lines.pop() || "";
          stdout = lines.join("\n");
        }

        return {
          ...restofResult,
          stdout,
          actualResult: resultValue,
          expectedResult: expectedResultValue,
          isMatch:
            result.stderr !== null
              ? false
              : resultValue === expectedResultValue,
        };
      }
    );

    res.status(200).json({
      message: SUCCESS_MESSAGE,
      data: compilerData,
    });
  } catch {
    res.status(500).json({ message: ERROR_FAILED_TO_EXECUTE_MESSAGE });
  }
};
