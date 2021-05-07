import React, {useEffect, useState} from 'react';
import {SafeAreaView, StatusBar, StyleSheet, Text} from 'react-native';
import {run} from '../lib/testRunner';

const TestRunnerScreen = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState([]);
  useEffect(() => {
    const log = runnerEvent => {
      console.log(`TestRunner: ${JSON.stringify(runnerEvent)}`);
      setProgress(prev => prev.concat([runnerEvent]));
    };
    const reporter = {
      onComplete: () => {
        log({event: 'complete'});
      },
      onFail: ({duration, error, name}) => {
        log({duration, event: 'fail', name, message: error.message});
      },
      onPass: ({duration, name}) => {
        log({duration, event: 'pass', name});
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
      <Text style={styles.heading}>Test Runner</Text>
      {progress.map(({duration, event, name, message}, eventNumber) => {
        const text = ['complete', 'start'].includes(event)
          ? event
          : event === 'fail'
          ? `X ${name}: ${message} (${duration} ms)`
          : `√ ${name} (${duration} ms)`;
        return (
          <Text
            style={{...styles.progress, ...styles[`progress.${event}`]}}
            key={eventNumber}>
            <>{text}</>
          </Text>
        );
      })}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  heading: {
    color: 'lightgrey',
    padding: 20,
    fontSize: 24,
    fontWeight: '600',
  },
  progress: {
    padding: 3,
  },
  'progress.complete': {
    color: 'grey',
  },
  'progress.fail': {
    color: 'red',
  },
  'progress.pass': {
    color: 'green',
  },
  'progress.start': {
    color: 'grey',
  },
});

export default TestRunnerScreen;
