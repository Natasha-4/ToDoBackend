const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const PORT = process.env.PORT || 8080;
const MONGOURL = process.env.MONGOURL;

app.use(express.json());
mongoose.connect(MONGOURL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});
const User = mongoose.model("User", userSchema);
const taskSchema = new mongoose.Schema({
  text: String,
  status: String,
  priority: String,
  userId: mongoose.Schema.Types.ObjectId,
});
const Task = mongoose.model("Task", taskSchema);
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashed = await bcrypt(password, 10);
  const user = new User({ username, password: hashed });
  await user.save();
  res.json({ message: "user has been registered." });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.pass))) {
    return res.status(401).json({ message: "invalid credentials." });
  }
  const token = jwt.sign({ userId: user_id }, "secret", { expiresIn: "1h" });
  res.json({ token });
});
const authMiddleware = (req, res, next) => {
  const token = req.header("authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "no token" });
  try {
    const decode = jwt.verify(token, "secret");
    req.userId = decode.userId;
    next();
  } catch (e) {
    res.status(401).json({ message: "Invalid token" });
  }
};
// get task request
app.get("/task", authMiddleware, async (req, res) => {
  const tasks = await Task.find({ userId: req.userId });
  res.json(tasks);
});
// post task request
app.post("/task", authMiddleware, async (req, res) => {
  const task = new Task({ ...req.body, userId: req.userId });
  resjson(task);
});

// delete task request
app.delete("/task/:id", authMiddleware, async (req, res) => {
  await Task.findOneAndDelete({ _id: req.params.id.userId });
  res.json({ message: "Task Deleted" });
});

// updating the staus of the task
app.patch("/tasks/:id/status", authMiddleware, async (req, res) => {
  const { status } = req.body;
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: req.userId },
    { status },
    { new: true }
  );
  if (!task)
    return res
      .status(404)
      .json({ message: "the task searching does not exist." });
  res.json(task);
});
// priority tasks
app.patch("/tasks/:id/priority", authMiddleware, async (req, res) => {
  const { priority } = req.body;
  const task = await Task.findOneAndUpdate(
    { _id: req.params.id, userId: userId },
    { priority },
    { new: true }
  );
  if (!task) return res.status(404).json({ message: "task not found" });
  res.json(task);
});
app.listen(PORT, () => console.log("Server is running on port: 8080"));
