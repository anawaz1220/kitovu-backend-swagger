const { getRepository } = require("typeorm");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../entities/User");

const register = async (req, res) => {
  const userRepository = getRepository(User);
  const { email, username, password, role } = req.body;

  // Check if user already exists
  const existingUser = await userRepository.findOne({ where: [{ email }, { username }] });
  if (existingUser) {
    return res.status(400).json({ message: "User with this email or username already exists." });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user
  const user = userRepository.create({
    email,
    username,
    password: hashedPassword,
    role,
  });

  await userRepository.save(user);
  res.status(201).json({ message: "User registered successfully." });
};

const login = async (req, res) => {
    const userRepository = getRepository(User);
    const { email, password } = req.body;
  
    // Find user by email
    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }
  
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password." });
    }
  
    // Generate JWT token
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
  
    res.json({ toke:token, user:{email:user.email, username:user.username, role:user.username, id:user.id }});
  };
  

  const resetPassword = async (req, res) => {
    const userRepository = getRepository(User);
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id; // Get the logged-in user's ID from the JWT token
  
    // Find the user by ID
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
  
    // Verify the current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }
  
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
  
    // Update the password
    user.password = hashedPassword;
    await userRepository.save(user);
  
    res.json({ message: "Password reset successfully." });
  };
  
  module.exports = { register, login, resetPassword };