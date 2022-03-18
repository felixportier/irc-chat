import { Schema, model, connect, Document, AnyObject } from 'mongoose'
import User, { UserModel } from './users';
import Channel, { ChannelModel } from './channels'
import { ConnectDb, CurrentDate } from './helpers';
import { Compressor, ConnectionCheckedOutEvent } from 'mongodb';
import { Socket } from 'socket.io';

//INITIALIZE SERVER
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const cors = require('cors');
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ["GET", "POST"]
    }
});

// middleware
app.use(express.json());
app.use(express.urlencoded());


app.use(cors());

//Start server connection
server.listen(5000, () => {
    console.log("Server listening on *:5000")
})



///////////////////////////////////
///////INTERFACES//////////////////
//////////////////////////////////


interface Message {
    body: string
    senderId: string
    sentAt?: string
    sentBy?: string
    channelId:string
}


interface PrivateMessage {
    message:Message
    to:string
    from:string
}



///////////////////////////////////
///////////////ROUTES//////////////
///////////////////////////////////



/*////CHANNELS ROUTES/////*/

//Get all created channels from db
app.get("/channels", (_req: any, res: any) => {
    ConnectDb()
    ChannelModel.find({}, function (err: any, channels: Channel): any {
        if (err) res.status(200).send({ message: 'No Channels Found !', err });
        else res.send(channels);
    })
})


//Gets all info from given channel Name
app.get("/channels/:channelName", (req: any, res: any) => {
    ConnectDb()
    ChannelModel.findOne({ 'channelName': req.params.channelName }, (err: any, channel: Channel) => {
        if (err) res.status(200).send({ message: 'No channel with the name ' + req.params.channelName + ' was found' });
        if (!channel) res.status(200).send({ message: 'No channel with the name ' + req.params.channelName + ' was found' });
        else res.send(channel);
    })

})

//Gets all info from given channel Id
app.get("/channel/:channelId", (req: any, res: any) => {
    ConnectDb()
    ChannelModel.findOne({ 'channelId': req.params.channelId }, (err: any, channel: Channel) => {
        if (err) res.status(200).send({ message: 'No channel with the id ' + req.params.channelId + ' was found' });
        if (!channel) res.status(200).send({ message: 'No channel with the id ' + req.params.channelId + ' was found' });
        else res.send(channel).channelName;
    })

})

//Create new channels
app.post("/channels", async (req: any, res: any) => {
    ConnectDb()

    //Define model
    const doc = new ChannelModel({
        channelName: req.body.channelName,
        channelId: req.body.channelId,
        createdAt: CurrentDate(),
        messages: [],
        connectedUsers: []
    })


    console.log("Trying to save channel " + doc.channelName + " to db!")
    //Save model to db and send response 
    doc.save((err) => {
        if (err) res.send({ message: 'Error saving to DB ! channel already exsist', err });
        else res.send({ success: true, message: "Channel created successfully!" });
    });



})


//Delete existing channel
app.delete("/channels/:channelId", (req: any, res: any) => {
    ConnectDb()
    ChannelModel.deleteOne({ 'channelId': req.params.channelId }, (err: any) => {
        if (err) res.status(406).send({ message: "Delete failed" })
    })

})

//Update existing channel
app.post("/channels/:channelId", (req: any, res: any) => {
    ConnectDb()
    ChannelModel.updateOne({ 'channelId': req.params.channelId },
        {
            channelName: req.body.channelName
        },
        //Undefined options
        undefined,
        (err) => {
            if (err) res.send({ message: "Update failed", err });
            else res.send({ message: "Update successful" })
        })
})

/*////USERS ROUTES///*/


//Create new user
app.post("/users", async (req: any, res: any) => {
    const doc = new UserModel({
        userName: req.body.userName,
        createdAt: CurrentDate()
    })

    await doc.save((err) => {
        if (err) res.send({ message: 'Failed to create user, user probably exists', err });
        else res.send({ message: 'User successfully created' })
    })

})

//Update Username
app.post("/users/:userName", (req: any, res: any) => {
    ConnectDb()
    UserModel.updateOne({ 'userName': req.params.userName }, {
        userName: req.body.userName
    }, undefined,
        (err) => {
            if (err) res.send({ message: "Failed to change nickname for this user", err })
            else res.send({ message: "user updated successfully" })
        }

    )


})


//Get all users
app.get("/users", (req: any, res: any) => {
    ConnectDb()
    UserModel.find({}, (err: any, users: any) => {
        if (err) res.send({ message: "Error getting users" });
        else res.send(users)
    })



})

//Get username by name
app.get("/users/:userName", (req: any, res: any) => {

    ConnectDb()
    UserModel.findOne({ 'userName': req.params.userName }, function (err: any, user: User): any {
        if (!user) res.send({ message: "User not found ", err });
        else res.send(user)
    })

})


//Gets all messages for given channel Id
app.get("/messages/:channelId", (req: any, res: any) => {
    ConnectDb()

    ChannelModel.findOne({ 'channelId': req.params.channelId }, function (err: any, channel: Channel): any {
        if (err) res.send({ message: "Error fetching messages for this channel", err })
        else res.send(channel)
    })

})


//ChatRoom logic

var channelId: string;
let currentUser:User = {
    userName:''
}
io.on('connection', (socket: any) => {



    ConnectDb()
    socket.join(channelId)

    socket.join(currentUser.userName)
    //Listen to new_message event from client
    socket.on('new_message', async (data: Message) => {
        //Execute new_message on client
        console.log("message received: " + data.body + ", Sent at " + data.sentAt + " ,Sent by: " + data.sentBy + " in channel number " + data.channelId)
        io.to(data.channelId).emit('new_message', {
            body: data.body,
            senderId: data.senderId,
            sentAt: data.sentAt,
            sentBy: data.sentBy,
        })

        ChannelModel.updateOne({ channelId: data.channelId }, {
            $push: { "messages": data }
        }, undefined, (err) => {

        }
        )

    })

    socket.on('joined', (data: any) => {

        console.log(JSON.stringify(data.user.userName) + " Connected to the chatRoom! " + data.channelId + " " + data.user.userName)
        channelId = data.channelId
        socket.join(data.channelId)
        currentUser = data.user

        //Store username in the socket session

        ChannelModel.updateOne({ channelId: channelId }, {
            $push: {
                "connectedUsers": data.user
            }
        }, undefined, (err) => {
            if (err) console.log(err)
        })

        var today = new Date();
        var date = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        io.to(data.channelId).emit('new_message', {
            body: data.user.userName + " Joined the channel",
            senderId: data.senderId,
            sentAt: date,
            sentBy: "SYSTEM",
        })

    })

    //Broadcast to other the typing event
    socket.on('typing', () => {
        socket.to(socket.channelId).emit('typing', {
            username: socket.username
        })
    })

    socket.on('private_message', (data: PrivateMessage) => {

        const dest = data.to
        const message = data.message
        console.log("private message: " + message + " sent to " + dest + " from " + data.from)

        io.to(dest).emit('private_message', {
            userName: data.from,
            message: {
                body: message,
            }
        })
    })

    socket.on('user_left', (userName: String) => {
        var today = new Date();
        var date = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        io.to(channelId).emit('new_message', {
            body: userName + " Left the channel",
            sentBy: "SYSTEM",
            sentAt:date
        })

        socket.leave(channelId)

        // ChannelModel.updateOne({ channelId: channelId }, {
        //     $pull: {
        //         connectedUsers: { userName: userName }
        //     }
        // }, undefined, (err) => {
        //     if (err) console.log(err)
        // }
        //)

    })


    //Broadcast the stop typing event to all clients
    socket.on('typing_stop', () => {
        socket.to(channelId).emit('typing_stop', {
            username: socket.username
        })
    })

    //Listen to disconnect event
    socket.on('disconnect', (data: any) => {


        socket.leave(channelId)
        var today = new Date();
        var date = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        // io.to(channelId).emit('new_message', {
        //     body: currentUser.userName + " Left the channel",
        //     sentBy: "SYSTEM",
        //     sentAt:date
        // })
        ChannelModel.updateOne({ channelId: channelId }, {
            $pull: {
                connectedUsers: { userName: currentUser.userName }
            }
        }, undefined, (err) => {
            if (err) console.log(err)
        }
        )

    })
})

