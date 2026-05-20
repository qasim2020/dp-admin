const mongoose = require('mongoose');
require('dotenv').config();
const Blog = require('./models/Blog');
const TeamMember = require('./models/TeamMember');
const GalleryItem = require('./models/GalleryItem');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('--- Blog Samples ---');
    const blogs = await Blog.find({}).limit(3).select('coverImageUrl');
    blogs.forEach(b => console.log(b.coverImageUrl));

    console.log('--- TeamMember Samples ---');
    const team = await TeamMember.find({}).limit(3).select('imageUrl');
    team.forEach(t => console.log(t.imageUrl));

    console.log('--- GalleryItem Samples ---');
    const gallery = await GalleryItem.find({}).limit(3).select('url');
    gallery.forEach(g => console.log(g.url));

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.connection.close();
  }
}

run();
