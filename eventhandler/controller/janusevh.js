// post: token; returns status: verified|needslogin|invalid or error: message
function postEvent(req, res) {
  //console.log(req.body);
  let body = req.body[0]
  let type = body.type
  let timestamp = body.timestamp
  let when = new Date(timestamp/1000);

  console.log(when, "---------------------------------- got event, type", type);


  // Session related event
  if (type === 1) {
    let event = body.event
    let session_id =  body.session_id

    if(event.name == "created") {
      console.log(when, "session", event.name, "#" + session_id );
    } else if (event.name == "destroyed") {
      console.log(when, "session", event.name, "#" + session_id );
    }
    else
      console.log(when, body);

  // Handle related event
  } else if (type === 2) {

    let event = body.event
    let session_id =  body.session_id
    let handle_id =  body.handle_id
    //let opaque_id =  body.opaque_id
    let plugin = event.plugin

    if(event.name == "attached") {
      console.log(when, plugin, event.name, "handle #" + handle_id , "session #" + session_id );
    } else if (event.name == "leaving") {
      console.log(when, plugin, event.name, "handle #" + handle_id , "session #" + session_id );
    }

  // External event (injected via Admin API)
  } else if (type === 4) {

  // JSEP event (SDP offer/answer)
  } else if (type === 8) {

  // WebRTC state event (ICE/DTLS states, candidates, etc.)
  } else if (type === 16) {

  // Media event (media state, reports, etc.)
  } else if (type === 32) {
    let subtype = body.subtype
    if (subtype === 1) {
      // Medium state
    } else if (subtype === 2) {
      // Slow link
    } else if (subtype === 3) {
      // Report/stats
    }

  // Plugin-originated event (e.g., event coming from VideoRoom)
  } else if (type === 64) {
    //let session_id =  body.session_id
    //let handle_id =  body.handle_id
    //let opaque_id =  body.opaque_id
    let event = body.event
    let plugin = event.plugin
    console.log(when, plugin, event.data.event, "room #" + event.data.room);

  // Transport-originated event (e.g., WebSocket connection state)
  } else if (type === 128) {

  // Core event (server startup/shutdown)
  } else if (type === 128) {
    let subtype = body.subtype
    if (subtype === 1) {
      // Server startup
    } else if (subtype === 2) {
      // Server shutdown
    }
  }


	return res.json({
		success: true,
	});
}

module.exports = {
	postEvent,
}
