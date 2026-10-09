const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});





// Exercise Tracker (in-memory storage)
const crypto = require('crypto')
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

const users = [] // { _id, username, log: [{ description, duration, date: Date }] }
const newId = () => crypto.randomBytes(12).toString('hex')

app.post('/api/users', (req, res) => {
  const username = (req.body.username || '').trim()
  if (!username) return res.json({ error: 'username is required' })
  const user = { _id: newId(), username, log: [] }
  users.push(user)
  res.json({ username: user.username, _id: user._id })
})

app.get('/api/users', (req, res) => {
  res.json(users.map(u => ({ username: u.username, _id: u._id })))
})

app.post('/api/users/:_id/exercises', (req, res) => {
  const user = users.find(u => u._id === req.params._id)
  if (!user) return res.json({ error: 'unknown user id' })
  const { description } = req.body
  const duration = Number(req.body.duration)
  if (!description) return res.json({ error: 'description is required' })
  if (!req.body.duration || isNaN(duration)) return res.json({ error: 'duration must be a number' })
  const date = req.body.date ? new Date(req.body.date) : new Date()
  if (isNaN(date.getTime())) return res.json({ error: 'invalid date' })
  const exercise = { description: String(description), duration, date }
  user.log.push(exercise)
  res.json({
    _id: user._id,
    username: user.username,
    date: date.toDateString(),
    duration,
    description: exercise.description
  })
})

app.get('/api/users/:_id/logs', (req, res) => {
  const user = users.find(u => u._id === req.params._id)
  if (!user) return res.json({ error: 'unknown user id' })
  const { from, to, limit } = req.query
  let log = user.log.slice()
  if (from) {
    const f = new Date(from)
    if (!isNaN(f.getTime())) log = log.filter(e => e.date >= f)
  }
  if (to) {
    const t = new Date(to)
    if (!isNaN(t.getTime())) log = log.filter(e => e.date <= t)
  }
  const lim = parseInt(limit, 10)
  if (!isNaN(lim) && lim >= 0) log = log.slice(0, lim)
  const result = {
    _id: user._id,
    username: user.username
  }
  if (from) result.from = new Date(from).toDateString()
  if (to) result.to = new Date(to).toDateString()
  result.count = log.length
  result.log = log.map(e => ({
    description: e.description,
    duration: e.duration,
    date: e.date.toDateString()
  }))
  res.json(result)
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
