import React, {useEffect, useState} from 'react';
import {SafeAreaView, StatusBar, StyleSheet, Text} from 'react-native';
import {run} from '../lib/testRunner';

const CaptureTestRunner = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState([]);
  useEffect(() => {
    const log = ({event, message, name}) => {
      console.log('CaptureTestRunner', {
        event,
        ...(message && {message}),
        ...(name && {name}),
      });
      setProgress(prev =>
        prev.concat([`${event} ${name || ''} ${message || ''}`]),
      );
    };
    const reporter = {
      onComplete: () => {
        log({event: 'complete'});
      },
      onFail: (name, error) => {
        log({event: 'fail', name, message: error.message});
      },
      onPass: name => {
        log({event: 'pass', name});
      },
      onStart: () => {
        log({event: 'start'});
      },
    };
    if (!isRunning) {
      setIsRunning(true);
      run(reporter);
    }
  }, [isRunning]);
  return (
    <SafeAreaView>
      <StatusBar />
      <Text style={styles.heading}>Capture Test Runner</Text>
      <Text style={styles.progress}>{progress.join('\n')}</Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  heading: {
    color: 'lightgreen',
    padding: 20,
  },
  progress: {
    color: 'grey',
    padding: 3,
  },
});

export default CaptureTestRunner;
