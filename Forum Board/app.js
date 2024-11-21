const { name } = require('ejs')
const express = require('express')
const app = express()
const sqlite3 = require('sqlite3')
const { v4: uuidv4 } = require('uuid')
const jwt = require('jsonwebtoken')
const session = require('express-session')

const db = new sqlite3.Database('data/data.db', (err) => {
    if (err) {
        console.log(err);
    } else {
        console.log('Connected to the data/Database.db!')
    }
});

const FBJS_URL = 'http://172.16.3.100:420'
const THIS_URL = 'http://localhost:3000/login'

function isAuthenticated(req, res, next) {
    if (req.session.user) next()
    else res.redirect(`${FBJS_URL}/oauth?redirectURL=${THIS_URL}`)
}

app.use(express.urlencoded({ extended: true }))

app.set('view engine', "ejs")

app.use(session({
    secret: 'big raga the opp stoppa',
    resave: false,
    saveUninitialized: false
}))


app.get('/', isAuthenticated, (req, res) => {
    try {
        res.render('index', { user: req.session.user })
    }
    catch (error) {
        res.send(error.message)
    }
})

app.get('/conversation', (req, res) => {
    if (req.query.name) {
        db.get('SELECT COUNT(*) AS count FROM conversation', (err, row) => {
            if (err) {
                console.log(err);
            } else {
                console.log(row.count);
                res.render('conversation', { conversationNumber: row.count, name: req.query.name });
            }
        });
    } else {
        res.redirect('/')
    }
});

app.get('/chat', (req, res) => {
    db.get('SELECT * FROM conversation WHERE uid=?', req.query.conversationNumber, (err, convoNumber) => {
        if (err) {
            console.log(err);
        } else {
            db.all('SELECT * FROM posts INNER JOIN users ON posts.poster=users.uid WHERE convo_id=? ORDER BY time', convoNumber.uid, (err, post) => {
                if (err) {
                    console.log(err);
                } else {
                    if (req.query.name) {
                        res.render('chat', { username: req.query.name, posts: post })
                    } else {
                        res.render('chat', { posts: post })
                    }
                }
            });
        }
    });
});

app.get('/login', (req, res) => {
    if (req.query.token) {
        let tokenData = jwt.decode(req.query.token);
        req.session.token = tokenData;
        console.log(tokenData)
        req.session.user = tokenData.username;
        req.session.userid = tokenData.id;

        db.get('SELECT * FROM users WHERE fb_name=?', req.session.user, (err, row) => {
            if (err) {
                console.log(err)
                res.send("There big bad error:\n" + err)
            } else if (!row) {
                db.run('INSERT INTO users(fb_name, fb_id) VALUES(?, ?);', [req.session.user, req.session.userid], (err) => {
                    if (err) {
                        console.log(err)
                        res.send("Database error:\n" + err)
                    }
                });
            }
        });

        res.redirect('/');
    } else {
        res.redirect(`${AUTH_URL}?redirectURL=${THIS_URL}`);
    };
});

// const { WebSocketServer } = require('ws')
// const wss = new WebSocketServer({ port: 443 })

// wss.on('connection', ws => {
//     console.log("Client connected");
//     ws.send(JSON.stringify({ name: "Server", text: "Hello and welcome to the server!" }))
//     ws.on('message', (message) => {
//         message = JSON.parse(message)
//         if (message.name) {
//             ws.name = message.name
//             if (!message.text) {
//                 broadcast(wss, {name: "Server", text: ws.name+" has connected!"})
//             }
//             broadcast(wss, {list: userList(wss)})
//         }
//         if (message.text) {
            
//             broadcast(wss, message)
            
            
//         }
//         if (message.name) {
//             ws.name = message.name
//         }
//     })
//     ws.on('close', ws => {
//         broadcast(wss, {name: "Server", text: "A user has disconnected!"})
//         broadcast(wss, {list: userList(wss)})
        
//     })
// });


app.listen(3000, () => {
    console.log(`Listening on ${3000}`)
});

function broadcast(wss, message) {
    for (client of wss.clients) {
        client.send(JSON.stringify(message))
    };
}

function userList(wss) {
    var userlist = []
    for (client of wss.clients) {
        if (client.name) {
            userlist.push(client.name)
        }
    }
    return userlist
}