require('dotenv').config();

const mongoose = require('mongoose');

const app = require('./app');

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
      .then(()=>{
        console.log('Mongo connected');
        app.listen(PORT, ()=>console.log(`Server running on ${PORT}`));
      })
      .catch((err)=>{
          console.error('Mongo connection failed',err);
          process.exit(1);
      })