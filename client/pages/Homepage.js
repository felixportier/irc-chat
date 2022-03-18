/* eslint-disable react/jsx-no-undef */
import React, { useContext, useState, useEffect, initialState } from 'react';
import { Form, Button, InputGroup, FormControl, Col, Container, Row } from 'react-bootstrap'
import { faAngellist } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { io } from 'socket.io-client'
import { useRouter } from 'next/router'
import axios from 'axios'
import './Chat.js'
import GlobalContext from '../utils/global_context';
import { v4 as uuidv4 } from 'uuid';

function Homepage() {

  //Use global state to log userinfo to use in chat pagz
  const globalState = useContext(GlobalContext)

  //Define a value to act as state for this component 
  //use setValue() to set value of state
  const [value, setValue] = useState('value')
  const [channels, setChannels] = useState([])
  //Socket initialization
  const socket = io("http://localhost:5000")
  const router = useRouter()

  //Username Prompt
  let userName;
  let roomId;
  let roomName;
  let userConnected = false;


  useEffect(() => {
    fetch('http://localhost:5000/channels')
      .then((res) => res.json())
      .then((data) => {
        if (data.length == 0) console.log("no channels")
        setChannels(data)
      })


  }, [channels])




  //Sets client username

  //Creates new channel
  async function CreateChannel(event) {
    event.preventDefault()
    console.log(uuidv4())

    const formData = new FormData(event.target),
      channelData = Object.fromEntries(formData.entries())



    var channel = {
      channelName: channelData.channelName,
      channelId: uuidv4()
    }

    await axios.post('http://localhost:5000/channels/', channel).then(function (response) {
      alert(JSON.stringify(response))
    })

    fetch('http://localhost:5000/channels')
      .then((res) => res.json())
      .then((data) => {

        setChannels(data)
      })

  }



  //Handles the form submission
  async function HandleSubmit(event) {
    event.preventDefault()
    //create a formdata  obj access the submited value
    const formData = new FormData(event.target),
      formDataObj = Object.fromEntries(formData.entries())

    userName = formDataObj.userName
    roomId = formDataObj.selectedRoom
    console.log(roomId)
    setValue(userName)

    var user = {
      userName: userName,
    }


    //Check if user already exists , if not save it to db
    try {
      localStorage.setItem("user", userName);
      localStorage.setItem("channelID", roomId);
      const res = await axios.get('http://localhost:5000/users/' + userName)

      if (res.data.message) {
        var newUser;
        await axios.post('http://localhost:5000/users/', user)

        await axios.get('http://localhost:5000/users/' + user.userName).then((res) => {
          newUser = res.data
        })
        console.log(newUser)
        socket.emit('joined', {
          user: newUser,
          channelId: roomId
        })

        router.push("/Chat")
      } else {
        console.log(res.data)
        socket.emit('joined', {
          user: res.data,
          channelId: roomId
        })
        router.push("/Chat")
      }
    } catch (error) {
      console.log(error)
    }

  }



  return (
    <div class="homeContainer">
      { channels.length &&
      <div class="row">

        <form name='form1' class="form" onSubmit={HandleSubmit}>
          <div class="row">
            <label class="label" for="userName">Username</label>
            <input class="input" type="text" name='userName' placeholder="Enter Username ..." required isInvalid />
          </div>

          <div class="row">
            <label class="label" for="selectedRoom">Room</label>

            <select class="input" name='selectedRoom' aria-label="Default select example">
              {channels.map(channel => (
                <option value={channel.channelId} >{channel.channelName}</option>
              ))}
            </select>
          </div>

          <div class="row">
            <button class="btnInput" type="submit" variant="outline-primary">Join Chat !</button>
          </div>
        </form>



      </div>
      }
      <div class='row'>

        <form name="form2" class="form" onSubmit={CreateChannel}>
          <div class="row">
            <label class="label" for="channelName" >Create Room</label>
            <input
              class="input"
              name="channelName"
              aria-label="Default"
              aria-describedby="inputGroup-sizing-default" />
          </div>

          <div class="row">
            <button class="btnInput" type="submit" variant="primary">New channel</button>
          </div>
        </form>

      </div>

    </div>
  );

}

export default Homepage;