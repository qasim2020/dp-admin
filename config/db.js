const mongoose = require("mongoose");
const User = require('../models/User');
const Page = require('../models/Page');

async function connectDB() {
  await mongoose.connect(process.env.MONGO_URI);
  await createDefaultUser();
  await seedDefaultPages();
}

async function createDefaultUser() {
    const existing = await User.findOne();
    if (!existing) {
        await User.create({
            name: 'Qasim Ali',
            email: 'qasimali24@gmail.com'
        });
    }
}

async function seedDefaultPages() {
  const defaults = [
    {
      key: 'about',
      type: 'page',
      title: 'About',
      content: `
<h2>About Dedicated Parents</h2>
<p>Dedicated Parents is a community-driven organisation supporting families through causes, events, and meaningful programmes.</p>
<h3>Our Mission</h3>
<p>To empower parents and children by building connected, caring communities where every family can thrive.</p>
<h3>What We Do</h3>
<ul>
  <li>Community causes and fundraising</li>
  <li>Family events and gatherings</li>
  <li>Support resources for parents</li>
</ul>
      `.trim(),
    },
    {
      key: 'contact',
      type: 'page',
      title: 'Contact',
      content: `
<h2>Contact Us</h2>
<p>We'd love to hear from you. Reach out via the contact form on the website or email us directly.</p>
      `.trim(),
    },
    {
      key: 'privacy-policy',
      type: 'legal',
      title: 'Privacy Policy',
      content: `<h2>Privacy Policy</h2><p>Your privacy matters to us. We collect only necessary information and never share it without consent.</p>`,
    },
    {
      key: 'terms-of-service',
      type: 'legal',
      title: 'Terms of Service',
      content: `<h2>Terms of Service</h2><p>By using this website, you agree to our terms. Content is provided for informational purposes only.</p>`,
    },
  ];

  for (const page of defaults) {
    const exists = await Page.findOne({ key: page.key, type: page.type });
    if (!exists) await Page.create(page);
  }
}

module.exports = connectDB;
