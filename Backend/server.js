const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Project, Task } = require('./models');
const User = require('./validation');

const app = express();
app.use(express.json())
app.use(cors());

const session = require('express-session');

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
}));

mongoose.connect('mongodb://127.0.0.1:27017/project-management', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
    });


app.post('/api/projects', (req, res) => {
    const { name, description } = req.body;

    const project = new Project({ name, description });

    project.save()
        .then((savedProject) => {
            res.json(savedProject);
        })
        .catch((error) => {
            res.status(500).json({ error: 'An error occurred while saving the project' });
        });
});

app.post('/api/tasks', (req, res) => {
    const { projectId, name, description } = req.body;

    const task = new Task({ projectId, name, description });

    task.save()
        .then((savedTask) => {
            res.json(savedTask);
        })
        .catch((error) => {
            res.status(500).json({ error: 'An error occurred while saving the task' });
        });
});

app.get('/api/projects', async (req, res) => {
    try {
        const projects = await Project.find({});
        res.json(projects);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred' });
    }
});

app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await Task.find({});
        res.json(tasks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred' });
    }
});

app.put('/api/projects/:id', async (req, res) => {
    const projectId = req.params.id;
    const { name, description } = req.body;

    try {
        const updatedProject = await Project.findByIdAndUpdate(projectId, { name, description }, { new: true });
        if (updatedProject) {
            res.json(updatedProject);
        } else {
            res.status(404).json({ error: 'Project not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while updating the project' });
    }
});

app.put('/api/tasks/:id', async (req, res) => {
    const taskId = req.params.id;
    const { projectId, name, description } = req.body;

    try {
        const updatedTask = await Task.findByIdAndUpdate(taskId, { projectId, name, description }, { new: true });
        if (updatedTask) {
            res.json(updatedTask);
        } else {
            res.status(404).json({ error: 'Task not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while updating the task' });
    }
});

app.delete('/api/projects/:id', async (req, res) => {
    const projectId = req.params.id;

    try {
        const deletedProject = await Project.findByIdAndDelete(projectId);
        if (deletedProject) {
            res.json({ message: 'Project deleted successfully' });
        } else {
            res.status(404).json({ error: 'Project not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while deleting the project' });
    }
});

app.delete('/api/tasks/:id', async (req, res) => {
    const taskId = req.params.id;

    try {
        const deletedTask = await Task.findByIdAndDelete(taskId);
        if (deletedTask) {
            res.json({ message: 'Task deleted successfully' });
        } else {
            res.status(404).json({ error: 'Task not found' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'An error occurred while deleting the task' });
    }
});

app.post('/register', async (req, res) => {
    const userInput = req.body;

    const errors = validateRegistrationInput(userInput);

    if (errors.length > 0) {
        return res.status(400).json({ errors });
    }

    try {
        const existingUser = await User.findOne({ email: userInput.email });
        if (existingUser) {
            return res.status(409).json({ error: 'User with this email already exists' });
        }

        const newUser = new User({
            name: userInput.name,
            email: userInput.email,
            hashedPassword: userInput.password,
        });

        await newUser.save();

        return res.json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        return res.status(500).json({ error: 'An error occurred while registering the user' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Retrieve the user record from the database
        const user = await User.findOne({ email });

        // If the user doesn't exist, show an error message
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Compare the provided password with the hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        // If the passwords don't match, show an error message
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Create a session to maintain the user's login state
        req.session.user = user;

        // Redirect the user to the dashboard or desired route
        res.redirect('/dashboard');

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

function requireAuth(req, res, next) {
    if (req.session.user) {
        // User is authenticated, allow them to proceed
        next();
    } else {
        // User is not authenticated, redirect to the login page
        res.redirect('/login');
    }
}

app.get('/dashboard', requireAuth, (req, res) => {
    // Render the dashboard template or return relevant data
    res.render('dashboard');
});

app.get('/logout', (req, res) => {
    // Destroy the user's session
    req.session.destroy();

    // Redirect the user to the login page or desired route
    res.redirect('/login');
});

const port = 3000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});