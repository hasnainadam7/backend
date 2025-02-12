import { apiError } from "./api_errors.js";

class Validator {
  // Validate Email
  static isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      throw apiError(400, "Invalid email format");
    }
    return true;
  }

  // Validate Password (At least 8 characters, one uppercase, one lowercase, one number, one special character)
  static isValidPassword(password) {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      throw apiError(
        400,
        "Password must be at least 8 characters long, include one uppercase letter, one lowercase letter, one number, and one special character"
      );
    }
    return true;
  }

  // Validate Phone Number (Supports international format)
  static isValidPhoneNumber(phone) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      throw apiError(400, "Invalid phone number format");
    }
    return true;
  }

  // Validate Username (Only alphanumeric, underscores, 3-16 characters)
  static isValidUsername(username) {
    const usernameRegex = /^[a-zA-Z0-9_]{3,16}$/;
    if (!usernameRegex.test(username)) {
      throw apiError(
        400,
        "Username must be 3-16 characters long and can only contain letters, numbers, and underscores"
      );
    }
    return true;
  }

  // Validate URL
  static isValidURL(url) {
    const urlRegex =
      /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/;
    if (!urlRegex.test(url)) {
      throw apiError(400, "Invalid URL format");
    }
    return true;
  }
}
