const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', function(req, res) {
  res.json({ message: 'Hello World!' });
});

app.listen(PORT, function() {
  console.log(`Server running on port ${PORT}`);
});
