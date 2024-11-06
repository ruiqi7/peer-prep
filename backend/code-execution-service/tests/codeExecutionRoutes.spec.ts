import supertest from "supertest";
import app from "../app";
import {
  ERROR_MISSING_REQUIRED_FIELDS_MESSAGE,
  ERROR_UNSUPPORTED_LANGUAGE_MESSAGE,
  ERROR_NOT_SAME_LENGTH_MESSAGE,
  SUCCESS_MESSAGE,
} from "../src/utils/constants";
import { questionService } from "../src/utils/questionApi";

const request = supertest(app);

const BASE_URL = "/api";

jest.mock("../src/utils/questionApi", () => ({
  questionService: {
    get: jest.fn(),
  },
}));

describe("Code execution routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /", () => {
    it("should return 200 OK", (done) => {
      request.get("/").expect(200, done);
    });
  });

  describe("POST /api/run", () => {
    it("should return 400 if required fields are missing", async () => {
      const response = await request
        .post(`${BASE_URL}/run`)
        .send({ language: "python" });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(ERROR_MISSING_REQUIRED_FIELDS_MESSAGE);
    });

    it("should return 400 if the language is unsupported", async () => {
      const response = await request.post(`${BASE_URL}/run`).send({
        language: "testing1234",
        code: "print('Hello, world!')",
        questionId: "1234",
      });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(ERROR_UNSUPPORTED_LANGUAGE_MESSAGE);
    });

    it("should return 400 if stdinList and stdoutList lengths do not match", async () => {
      (questionService.get as jest.Mock).mockResolvedValue({
        data: {
          question: {
            inputs: ["1", "2"],
            outputs: ["1"],
          },
        },
      });

      const response = await request.post(`${BASE_URL}/run`).send({
        language: "python",
        code: "print('Hello, world!')",
        questionId: "1234",
      });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe(ERROR_NOT_SAME_LENGTH_MESSAGE);
    });

    it("should return 200 and execution result when code executes successfully", async () => {
      (questionService.get as jest.Mock).mockResolvedValue({
        data: {
          question: {
            inputs: ["1", "2"],
            outputs: ["1", "2"],
          },
        },
      });

      const response = await request.post(`${BASE_URL}/run`).send({
        language: "python",
        code: "print(input())",
        questionId: "1234",
      });

      console.log(response.body);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe(SUCCESS_MESSAGE);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data[0]).toHaveProperty("isMatch", true);
      expect(response.body.data[0]["isMatch"]).toBe(true);
      expect(response.body.data[1]["isMatch"]).toBe(false);
    });
  });
});
