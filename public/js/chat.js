const socket =io()

//element
const $messageForm=document.querySelector('#message-form')
const $messageFormInput= document.querySelector('input')
const $messageFormButton= document.querySelector('button')
const $messageFormLocatinButton=document.querySelector('#Share-location')
const $messages= document.querySelector('#messages')

//templates
const $messageTemplate = document.querySelector('#message-template').innerHTML
const $LocationTemplate = document.querySelector('#location-tempalte').innerHTML 
const $sidebar = document.querySelector('#sidebar').innerHTML
//options
const {username , room } = Qs.parse(location.search, { ignoreQueryPrefix : true })
const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    console.log(newMessageMargin)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = Math.ceil($messages.scrollTop + visibleHeight)

    if ((containerHeight - newMessageHeight) <= (scrollOffset)) {
        $messages.scrollTop = $messages.scrollHeight
    }
}



socket.on('message',(message)=>{
    console.log(Qs.parse(location.search, {ignoreQueryPrifex :true}))
    console.log(message)
    const html=Mustache.render($messageTemplate,{
        username:message.username,
        message: message.text,
        CreatedAt : moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
    autoscroll()
})

socket.on('locationMeassage',(url)=>{
    console.log(url)
    const link = Mustache.render($LocationTemplate,{
        username:url.username,
        url: url.url,
        CreatedAt: moment(url.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',link)
    autoscroll()
})

socket.on('roomData',({room,users})=>{
    const html =Mustache.render($sidebar,{
        room,
        users
    })
    document.querySelector('#side-bar').innerHTML=html
 })

document.querySelector("#message-form").addEventListener('submit',(e)=>{
    e.preventDefault()

    //disables
    $messageFormButton.setAttribute('disabled','disabled')

    const message=e.target.elements.message.value

    socket.emit('sendmessage',message ,(error)=>{
       
       //enable
    $messageFormButton.removeAttribute('disabled')
    $messageFormInput.value=''
    $messageFormInput.focus()
        if(error){
            return console.log(error)
        }
        
        console.log('Message Diliverd')
    })
})

$messageFormLocatinButton.addEventListener('click',()=>{
  if(!navigator.geolocation){
      return alert('Geolocation is not supported for your browser')
  } 
    $messageFormLocatinButton.setAttribute('disabled','disabled')
  navigator.geolocation.getCurrentPosition((position)=>{
      socket.emit('position',position.coords.longitude,position.coords.latitude,(ack)=>{
                $messageFormLocatinButton.removeAttribute('disabled') 
                console.log('location shared to you friends')
        })
    })

})




socket.emit('join',{ username , room },(error)=>{
    if(error){
        alert(error)
        location.href="/"
    }
    
})