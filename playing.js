app.post('/createSchool', (req, res) => {

  const newSchool = new Schools({
    name: req.query.name,
    identity: req.query.identity
  });

  newSchool.save()
    .then(val => {
      res.status(200).send(val)
    })
    .catch(e => {
      res.status(400).send(e);
    })

})

app.get('/deleteSchool', (req, res) => {
  Schools.deleteOne({
    identity: req.query.identity
  })
  .then(val => {
    res.status(200).send(val)
  })
  .catch(e => {
    res.status(400).send(e);
  })
})

app.get('/getSchool', (req, res) => {
  Schools.findOne({
    identity: req.query.identity
  })
  .then(val => {
    res.status(200).send(val)
  })
  .catch(e => {
    res.status(400).send(e);
  })
})

app.post('/updateSchool', (req, res) => {
  Schools.findOneAndUpdate({
    identity: req.query.identity
  }, {
    name: req.query.name,
    identity: req.query.identity
  })
  .then(val => {
    res.status(200).send(val)
  })
  .catch(e => {
    res.status(400).send(e);
  })
})
