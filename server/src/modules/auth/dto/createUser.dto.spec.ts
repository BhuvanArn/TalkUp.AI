import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { CreateUserDto } from "./createUser.dto";

describe("CreateUserDto", () => {
  let dto: CreateUserDto;

  beforeEach(() => {
    dto = new CreateUserDto();
  });

  describe("Valid DTOs", () => {
    it("should pass validation with all valid fields", async () => {
      dto.username = "AdminSys819";
      dto.email = "admin@example.com";
      dto.password = "Abcdefg1*";

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("should pass validation with various valid usernames", async () => {
      const validUsernames = [
        "A",
        "AdminSys819",
        "user123",
        "TestUser",
        "a".repeat(50),
        "UserWith Spaces",
        "User-With-Dashes",
        "User_With_Underscores",
        "User.With.Dots",
        "User@Email",
        "UserWith123Numbers",
        "SpecialChars!@#$%",
        "José",
        "用户名",
      ];

      for (const username of validUsernames) {
        const testDto = new CreateUserDto();
        testDto.username = username;
        testDto.email = "test@example.com";
        testDto.password = "ValidPass123!";

        const errors = await validate(testDto);
        expect(errors).toHaveLength(0);
      }
    });

    it("should pass validation with various valid email addresses", async () => {
      const validEmails = [
        "test@example.com",
        "user@domain.org",
        "admin@company.co.uk",
        "john.doe@test.com",
        "user123@example.net",
        "contact@website.fr",
      ];

      for (const email of validEmails) {
        const testDto = new CreateUserDto();
        testDto.username = "TestUser";
        testDto.email = email;
        testDto.password = "ValidPass123!";

        const errors = await validate(testDto);
        expect(errors).toHaveLength(0);
      }
    });

    it("should pass validation with various strong passwords", async () => {
      const strongPasswords = [
        "Abcdefg1*",
        "Password1@",
        "MyStrongP@ss1",
        "Complex123!",
        "Hello@2012",
        "SecureP@ssw0rd123$",
        "A1@bcdefg",
      ];

      for (const password of strongPasswords) {
        const testDto = new CreateUserDto();
        testDto.username = "TestUser";
        testDto.email = "test@example.com";
        testDto.password = password;

        const errors = await validate(testDto);
        expect(errors).toHaveLength(0);
      }
    });
  });

  describe("Invalid username", () => {
    beforeEach(() => {
      dto.email = "test@example.com";
      dto.password = "ValidPass123!";
    });

    it("should fail validation for missing username", async () => {
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("username");
      expect(errors[0].constraints).toHaveProperty("isLength");
    });

    it("should fail validation for empty username", async () => {
      dto.username = "";

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("username");
      expect(errors[0].constraints).toHaveProperty("isLength");
    });

    it("should fail validation for username too long", async () => {
      dto.username = "a".repeat(51);

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("username");
      expect(errors[0].constraints).toHaveProperty("isLength");
    });

    it("should fail validation for non-string username", async () => {
      Object.assign(dto, { username: 12345 });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const usernameError = errors.find(
        (error) => error.property === "username",
      );
      expect(usernameError).toBeDefined();
    });

    it("should fail validation for null/undefined username", async () => {
      Object.assign(dto, { username: null });
      let errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);

      Object.assign(dto, { username: undefined });
      errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe("Invalid email", () => {
    beforeEach(() => {
      dto.username = "TestUser";
      dto.password = "ValidPass123!";
    });

    it("should fail validation for missing email", async () => {
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("email");
      expect(errors[0].constraints).toHaveProperty("isEmail");
    });

    it("should fail validation for empty email", async () => {
      dto.email = "";

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("email");
      expect(errors[0].constraints).toHaveProperty("isEmail");
    });

    it("should fail validation for invalid email formats", async () => {
      const invalidEmails = [
        "invalid-email",
        "@domain.com",
        "user@",
        "user.domain.com",
        "user @domain.com",
        "user@domain",
        "user@@domain.com",
      ];

      for (const email of invalidEmails) {
        const testDto = new CreateUserDto();
        testDto.username = "TestUser";
        testDto.email = email;
        testDto.password = "ValidPass123!";

        const errors = await validate(testDto);
        expect(errors.length).toBeGreaterThan(0);
        const emailError = errors.find((error) => error.property === "email");
        expect(emailError).toBeDefined();
      }
    });

    it("should fail validation for non-string email", async () => {
      Object.assign(dto, { email: 12345 });

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const emailError = errors.find((error) => error.property === "email");
      expect(emailError).toBeDefined();
    });
  });

  describe("Invalid password", () => {
    beforeEach(() => {
      dto.username = "TestUser";
      dto.email = "test@example.com";
    });

    it("should fail validation for missing password", async () => {
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe("password");
      expect(errors[0].constraints).toHaveProperty("isStrongPassword");
    });

    it("should fail validation for weak passwords", async () => {
      const weakPasswords = [
        "",
        "pass",
        "password",
        "Password",
        "Password1",
        "password1@",
        "PASSWORD1@",
        "Password@",
        "12345678@A",
        "a".repeat(8),
      ];

      for (const password of weakPasswords) {
        const testDto = new CreateUserDto();
        testDto.username = "TestUser";
        testDto.email = "test@example.com";
        testDto.password = password;

        const errors = await validate(testDto);
        expect(errors.length).toBeGreaterThan(0);
        const passwordError = errors.find(
          (error) => error.property === "password",
        );
        expect(passwordError).toBeDefined();
      }
    });

    it("should fail validation for password too short", async () => {
      dto.password = "Str0ng!";

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe("password");
      expect(errors[0].constraints).toHaveProperty("isLength");
    });

    it("should fail validation for password too long", async () => {
      dto.password = "A1@" + "b".repeat(50);

      const errors = await validate(dto);

      expect(errors.length).toBeGreaterThan(0);
      const passwordError = errors.find(
        (error) => error.property === "password",
      );
      expect(passwordError).toBeDefined();
      expect(passwordError!.constraints).toHaveProperty("isLength");
    });

    it("should fail validation for password missing required character types", async () => {
      const invalidPasswords = [
        "strongpass123!",
        "STRONGPASS123!",
        "StrongPass!",
        "StrongPass123",
      ];

      for (const password of invalidPasswords) {
        const testDto = new CreateUserDto();
        testDto.username = "TestUser";
        testDto.email = "test@example.com";
        testDto.password = password;

        const errors = await validate(testDto);
        expect(errors.length).toBeGreaterThan(0);
        const passwordError = errors.find(
          (error) => error.property === "password",
        );
        expect(passwordError).toBeDefined();
        expect(passwordError!.constraints).toHaveProperty("isStrongPassword");
      }
    });
  });

  describe("Multiple validation errors", () => {
    it("should return multiple errors when all fields are invalid", async () => {
      dto.username = "";
      dto.email = "invalid";
      dto.password = "weak";

      const errors = await validate(dto);

      expect(errors).toHaveLength(3);

      const usernameError = errors.find(
        (error) => error.property === "username",
      );
      const emailError = errors.find((error) => error.property === "email");
      const passwordError = errors.find(
        (error) => error.property === "password",
      );

      expect(usernameError).toBeDefined();
      expect(emailError).toBeDefined();
      expect(passwordError).toBeDefined();
    });

    it("should handle non-string values for all fields", async () => {
      Object.assign(dto, { username: 123, email: 456, password: 789 });

      const errors = await validate(dto);

      expect(errors).toHaveLength(3);
      expect(errors.map((e) => e.property).sort()).toEqual([
        "email",
        "password",
        "username",
      ]);
    });
  });

  describe("Edge cases", () => {
    it("should handle minimum valid lengths", async () => {
      dto.username = "A";
      dto.email = "a@b.co";
      dto.password = "A1@bcdef";

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("should handle maximum valid lengths", async () => {
      dto.username = "a".repeat(50);
      dto.email = "user@example.com";
      dto.password = "A1@" + "b".repeat(46);

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("should validate usernames with special characters", async () => {
      const specialUsernames = [
        "User@Domain",
        "User.Name",
        "User-Name",
        "User_Name",
        "User Name",
        "User123!@#",
        "José María",
        "用户123",
      ];

      for (const username of specialUsernames) {
        const testDto = new CreateUserDto();
        testDto.username = username;
        testDto.email = "test@example.com";
        testDto.password = "ValidPass123!";

        const errors = await validate(testDto);
        expect(errors).toHaveLength(0);
      }
    });

    it("should validate passwords with all required character types", async () => {
      dto.username = "TestUser";
      dto.email = "test@example.com";
      dto.password = "Aa1!bcdefg";

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("should validate passwords with various symbols", async () => {
      const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?/";

      for (const symbol of symbols) {
        const testDto = new CreateUserDto();
        testDto.username = "TestUser";
        testDto.email = "test@example.com";
        testDto.password = `Password1${symbol}`;

        const errors = await validate(testDto);
        expect(errors).toHaveLength(0);
      }
    });
  });

  describe("organizationCode (F2)", () => {
    it("accepts an optional organizationCode string", async () => {
      const dto = plainToInstance(CreateUserDto, {
        username: "candidate",
        email: "candidate@example.com",
        password: "Abcdefg1*",
        organizationCode: "ABCDEFGHJKLM",
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it("rejects a non-string organizationCode", async () => {
      const dto = plainToInstance(CreateUserDto, {
        username: "candidate",
        email: "candidate@example.com",
        password: "Abcdefg1*",
        organizationCode: 12345,
      });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === "organizationCode")).toBe(true);
    });
  });
});
