#!/bin/bash
#
# needs: Pulseaudio, VLC

# Load null sink module if not already loaded
pacmd list-sinks | grep steam 2>&1 >/dev/null
if [[ $? == 1 ]]; then
  pactl load-module module-null-sink sink_name=stream;
fi

# Get index of running Pianobar/Spotify sink.
# Move over if existing.
INDEX=`pacmd list-sink-inputs | grep index: | awk -F': ' '{ print $2 }'`
if [[ $INDEX != '' ]]; then
  echo "Stream output found, moving to steam sink"
  pactl move-sink-input $INDEX stream
else
  echo "ERROR: No Stream input found! Please change the output in the Pulseaudio mixer manually."
fi

# Start Stream
ffmpeg -f pulse -i stream.monitor -codec:a pcm_mulaw -ar 8000 -ac 1 -ab 6400 -f rtp rtp://127.0.0.1:9000                                                                                                                                                                    