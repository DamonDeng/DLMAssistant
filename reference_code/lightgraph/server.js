const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// const favicon = require('serve-favicon');
// const path = require('path');

// app.use(express.static(path.join(__dirname, 'public')));

// Serve static files from the 'public' directory
app.use(express.static('public'));


app.use('/css', express.static('css'));

app.use('/src', express.static('src'));

app.get('/load-json', (req, res) => {
    const filePath = path.join(__dirname, 'data', 'chart_state.json');
    
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading the file');
            return;
        }
        
        try {
            const jsonData = JSON.parse(data);
            res.json(jsonData);
        } catch (error) {
            res.status(500).send('Error parsing JSON');
        }
    });
});


// app.get('/', (req, res) => {
//     res.sendFile(__dirname + '/public/index.html');
// });

app.get('/public/first_graph.html', (req, res) => {
    res.sendFile(__dirname + '/public/first_graph.html');
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/first_graph.html');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
