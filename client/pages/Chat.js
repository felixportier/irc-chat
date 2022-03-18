import { Form, Button, Container, Row, Col, ListGroup, InputGroup, FormControl } from 'react-bootstrap'
import { faAngellist } from '@fortawesome/free-brands-svg-icons'
import { faMale, faTimesCircle, faPaperPlane, faSignOutAlt } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState, useEffect, useContext, initialState } from 'react'
import Router from 'next/router'
import { io } from 'socket.io-client'
import GlobalContext from '../utils/global_context'

import { v4 as uuidv4 } from 'uuid';
import axios from 'axios'
import { useRouter } from 'next/router'


let userName = "";
let roomID;
let cmdAllChannel;
let cmdSpeChannel;
let hasConnectedUsers = false;

function Chat() {


    const [currentChannel, setCurrentChannel] = useState()
    const [coUser, setCoUser] = useState([])
    const [messages, setMessages] = useState([])
    const [inputVal, setVal] = useState()
    const [channels, setChannels] = useState([])


    const router = useRouter();



    let message
    const socket = io("http://localhost:5000/")




    useEffect(() => {


        //SOCKET EVENTS
        const socket = io("http://localhost:5000/")
        const data = localStorage.getItem('user')
        if (data) {
            userName = data;
        }
        const dataCId = localStorage.getItem('channelID')
        if (dataCId) {
            roomID = dataCId;
        }


        const fetchData = () => {
            fetch("http://localhost:5000/messages/" + localStorage.getItem("channelID"))
                .then(response => {
                    return response.json()
                })
                .then(data => {
                    console.log(data)
                    setMessages(data.messages)
                    setCurrentChannel(data.channelName)
                    let arrayTmp = data.connectedUsers
                    setCoUser(arrayTmp)
                })

            fetch("http://localhost:5000/channels/")
                .then(response => {
                    return response.json()
                })
                .then(data => {
                    let arrayTmp = []
                    for (let i = 0; i !== data.length; i++) {
                        arrayTmp.push(data[i].channelName)
                    }
                    setChannels(arrayTmp)
                })

        }




        fetchData()



        //Update chat when new message received
        socket.on('new_message', (data) => {
            const incomingMessage = {
                ...data,
            }
            setMessages((messages) => [...messages, incomingMessage])
        })


        socket.on('private_message', (data) => {
            alert("Received private from " + data.userName + ": " + data.message.body)
           
        })



    }, [])

    /* Controle des commandes */
    const checkMessage = (message) => {

        if (message.startsWith("/nick" + " ")) {
            nick(message);
            return true
        } else if (message.startsWith("/list" + " ")) {
            listSpe(message);
            return true
        } else if (message === "/list") {
            list(message);
            return true
        } else if (message === "/clear") {
            clear();
            return true
        } else if (message === "/quit") {
            quit();
            return true
        } else if (message.startsWith("/create" + " ")) {
            create(message);
            return true
        } else if (message.startsWith("/msg" + " ")) {
            sendPrivateMsg(message)
            return true
        } else if (message === "/users") {
            user();
            return true;
        } else if (message.startsWith("/join" + " ")) {
            join(message);
            return true;
        } else if (message.startsWith("/delete" + " ")) {
            supp(message);
            return true;
        }


        else {
            return 0
        }


    }

    /* Commande pour toute les channels */
    const list = () => {
        cmdAllChannel = ""

        fetch("http://localhost:5000/channels/")
            .then(response => {
                return response.json()
            })
            .then(data => {

                let arrayTmp = []
                for (let i = 0; i !== data.length; i++) {
                    arrayTmp.push(data[i].channelName)
                }
                setChannels(arrayTmp)
            })
        console.log(channels)
        let str = ""
        /* Récupère toute les channels */
        for (let i = 0; i !== channels.length; i++) {
            if (str === "") {
                str = channels[i]
            } else {
                str = str + " | " + channels[i]
            }
        }
        cmdAllChannel = str;
    }

    async function supp(message) {
        const newChan = message.substring(8, message.length);
        let id;

        await axios.get('http://localhost:5000/channels/' + newChan).then(function (response) {
            id = response.data.channelId
        })

        await axios.delete('http://localhost:5000/channels/' + id).then(function (response) {

        })

    }

    /* Commande pour des channels spécifique */
    const listSpe = (message) => {
        cmdSpeChannel = ""
        const tmp = message.substring(6, message.length);

        fetch("http://localhost:5000/channels/")
            .then(response => {
                return response.json()
            })
            .then(data => {
                let arrayTmp = []
                for (let i = 0; i !== data.length; i++) {
                    arrayTmp.push(data[i].channelName)
                }
                setChannels(arrayTmp)
            })


        let str = ""
        /* Le for check si la string correspond à une channel deja existante et si oui j'enregistre  */
        for (let i = 0; i !== channels.length; i++) {
            if (channels[i].includes(tmp) === true) {
                if (str === "") {
                    str = channels[i]
                } else {
                    str = str + " | " + channels[i]
                }
            }
        }
        cmdSpeChannel = str;
    }

    /* Commande pour changer de username */
    const nick = (message) => {
        const newName = message.substring(6, message.length);
        userName = newName;

        axios.post("http://localhost:5000/users/" + localStorage.getItem("user"), {
            userName: userName
        })

        localStorage.setItem("user", userName);
    }

    /* Commande pour remettre a null les /list et ne plus les display */
    const clear = () => {
        cmdAllChannel = null;
        cmdSpeChannel = null;
    }

    async function user () {

        await axios.get("http://localhost:5000/messages/" + roomID)
            .then(response => {
                console.log(response.data)
                setCoUser(response.data.connectedUsers)
                hasConnectedUsers=true;
            })
        
    }

    function sendPrivateMsg(message) {
        const clean = message.substring(5, message.length);
        const destUser = clean.split(' ')[0]
        const sentMessage = clean.replace(destUser + " ", "")
        socket.emit("private_message", {
            from: localStorage.getItem("user"),
            to: destUser,
            message: sentMessage
        })
    }

    async function join(message) {
        var user = {
            userName: localStorage.getItem('user'),
        }

        const newChan = message.substring(6, message.length);



        await axios.get('http://localhost:5000/channels/' + newChan).then(function (response) {
            roomID = response.data.channelId
            localStorage.setItem('channelID', response.data.channelId)
            setMessages(response.data.messages)
            setCurrentChannel(response.data.channelName)
            socket.emit('joined', {
                user: user,
                channelId: roomID
            })
            router.reload()
        })


        // fetch("http://localhost:5000/messages/" + roomID)
        //     .then(response => {
        //         alert(JSON.stringify(response))
        //     })
        //     .then(data => {
        //         setMessages(data.messages)
        //         setCurrentChannel(data.channelName)
        //     })



    }

    /* Commande pour créer une channel depuis le chat */
    async function create(message) {
        const newChan = message.substring(8, message.length);

        var channel = {
            channelName: newChan,
            channelId: uuidv4()
        }

        await axios.post('http://localhost:5000/channels/', channel).then(function (response) {
            alert(JSON.stringify(response))
        })
    }

    const quit = () => {
        socket.emit('user_left', localStorage.getItem('user'))
        router.push("/Homepage");
    }

    const sendMessage = async (event) => {
        var today = new Date();
        var date = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
        event.preventDefault()
        const formData = new FormData(event.target),
            object = Object.fromEntries(formData.entries())
        message = object.message


        if (!checkMessage(message)) {
            socket.emit('new_message', {
                body: message,
                senderId: socket.id,
                sentAt: date,
                sentBy: userName,
                channelId: localStorage.getItem("channelID")
            })
        }






        setVal("")


    }

    const handleChange = (event) => {
        setVal(event.target.value)
    }

    //Displays typing 
    const addChatTyping = () => {

    }

    //undisplay typing
    const removeChatTyping = () => {

    }


    //try to sanitize user input
    const sanitizeInput = () => {

    }






    return (
        <div class='chatContainer'>
            <div class="row" name="header">
                <div class="col">
                    <h1 class='chatTitle'>{"Welcome to the " + currentChannel + " channel"}</h1>
                </div>
                <div class="colQuit">
                    <button class="quitBtn" onClick={quit}><FontAwesomeIcon icon={faSignOutAlt} /></button>
                </div>

            </div>
            <div class="row" >
                <div class="row">


                    <div class="col">
                        <div class="chatBox" >
                            <ul class="msgList">
                                {messages.map((message, i) => (
                                    <li class="messageElement" key={i}>
                                        {message.sentAt + " " + message.sentBy + ": " + message.body}
                                    </li>
                                ))}

                                {cmdAllChannel && <li class="channelElement">Available channels: {cmdAllChannel} (use /clear to clear this message)</li>}
                                {cmdSpeChannel && <li class="channelElement">Corresponding Channel: {cmdSpeChannel} (use /clear to clear this message)</li>}
                                {hasConnectedUsers && coUser.map((user, i) => (

                                    <li class="channelElement" key={i}>{user.userName}</li>
                                ))}
                            </ul>

                        </div>
                    </div>

                    <div class="colusers">
                        <span class="usersTitle"><FontAwesomeIcon icon={faMale} /> Connected Users</span>
                        <ul class="coUsersList">
                            {coUser.map((user, i) => (

                                <li key={i}>{user.userName}</li>
                            ))}

                        </ul>

                    </div>


                </div>
            </div>

            <div class="row">



                <form onSubmit={sendMessage}>

                    <input class="msgInput"
                        type="text"
                        onChange={handleChange}
                        value={inputVal}
                        name='message'
                        aria-label="Default"
                        aria-describedby="inputGroup-sizing-default"
                        placeholder='Enter a message ...'
                        required
                    />



                    <button class="send" type="submit" id="inputGroup-sizing-default"><FontAwesomeIcon icon={faPaperPlane} className='me-1' /></button>


                </form>



            </div>

        </div>
    );
}

export default Chat;