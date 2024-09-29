import cv2
import streamlit as st
from ultralytics import YOLO
from pathlib import Path

# Load YOLOv8 model
model = YOLO('yolov8n.pt')  # Use a smaller model for faster inference

# Set up Streamlit interface
st.title("Live Vehicle and People Detection from Online Video Stream")

start_button = st.button("Start Live Feed")
stop_button = st.button("Stop Live Feed")

# Initialize session state variables
if "running" not in st.session_state:
    st.session_state.running = False
if "car_count" not in st.session_state:
    st.session_state.car_count = 0
if "person_count" not in st.session_state:
    st.session_state.person_count = 0
if "previous_centroids" not in st.session_state:
    st.session_state.previous_centroids = {}

if start_button:
    st.session_state.running = True
if stop_button:
    st.session_state.running = False

# Define the URL for the .m3u8 video stream
stream_url = "https://165-d6.divas.cloud/CHAN-3733/CHAN-3733_1.stream/playlist.m3u8?207.104.43.103&vdswztokenhash=461LVNdYHfTNh83qZQ48fJzya9ED8ORLMpGwvS2ierc="

# Placeholder for video frames
frame_placeholder = st.empty()

def process_live_feed():
    cap = cv2.VideoCapture(stream_url)

    if not cap.isOpened():
        st.error("Error: Could not open video stream.")
        return

    while st.session_state.running:
        ret, frame = cap.read()
        if not ret:
            st.warning("No frame captured. Retrying...")
            continue  # Try to read the next frame

        # Perform inference on the frame
        results = model(frame)

        # Process detections
        detections = results[0].boxes.data.cpu().numpy()
        classes = results[0].boxes.cls.cpu().numpy()
        confidences = results[0].boxes.conf.cpu().numpy()

        # Draw trip line
        trip_line_y = int(frame.shape[0] * 0.5)
        cv2.line(frame, (0, trip_line_y), (frame.shape[1], trip_line_y), (0, 0, 255), 2)

        current_centroids = {}

        for i, det in enumerate(detections):
            x_min, y_min, x_max, y_max, score, _ = det
            class_id = int(classes[i])
            confidence = confidences[i]

            if class_id in [0, 2]:  # 0: person, 2: car
                class_name = 'person' if class_id == 0 else 'car'
                color = (255, 0, 0) if class_name == 'person' else (0, 255, 0)
                label = f"{class_name} {confidence:.2f}"

                x_min, y_min, x_max, y_max = map(int, [x_min, y_min, x_max, y_max])

                cv2.rectangle(frame, (x_min, y_min), (x_max, y_max), color, 2)
                cv2.putText(frame, label, (x_min, y_min - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

                centroid = (int((x_min + x_max) / 2), int((y_min + y_max) / 2))
                current_centroids[i] = (centroid, class_name)

                # Check if the object crossed the trip line
                prev_centroid = st.session_state.previous_centroids.get(i)
                if prev_centroid:
                    prev_y = prev_centroid[0][1]
                    curr_y = centroid[1]
                    if prev_y < trip_line_y <= curr_y:
                        if class_name == 'car':
                            st.session_state.car_count += 1
                        elif class_name == 'person':
                            st.session_state.person_count += 1

        st.session_state.previous_centroids = current_centroids

        # Display counts
        cv2.putText(frame, f"Cars: {st.session_state.car_count}", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.putText(frame, f"People: {st.session_state.person_count}", (10, 70),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)

        # Convert BGR to RGB for Streamlit display
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Display frame using Streamlit
        frame_placeholder.image(frame_rgb, channels="RGB", use_column_width=True)

    cap.release()

# Run live feed processing if the session state is set to running
if st.session_state.running:
    process_live_feed()


