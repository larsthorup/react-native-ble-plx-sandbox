import React, { useEffect, useState } from 'react';
import { SafeAreaView, StatusBar, StyleSheet, Text } from 'react-native';
import { run } from '../lib/testRunner';
import { TestRunnerEventReporter } from '../lib/TestRunnerEventReporter';
import { stringifyTestRunnerEvent } from '../lib/testRunnerJsonProtocol';

const TestRunnerScreen = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState([]);
  useEffect(() => {
    const log = runnerEvent => {
      console.log(stringifyTestRunnerEvent(runnerEvent));
      setProgress(prev => prev.concat([runnerEvent]));
    };
    const reporter = new TestRunnerEventReporter(log);
    if (!isRunning) {
      setIsRunning(true);
      run(reporter);
    }
  }, [isRunning]);
  return (
    <SafeAreaView>
      <StatusBar />
      <Text style={styles.heading}>Test Runner</Text>
      {progress.map(({ duration, event, name, message }, eventNumber) => {
        const text = (() => {
          switch (event) {
            case 'complete':
              return 'Done!';
            case 'fail':
              return `  X ${name}: ${message} (${duration} ms)`;
            case 'pass':
              return `  √ ${name} (${duration} ms)`;
            case 'start':
              return 'Running tests...';
            case 'suite:complete':
              return `  (${duration} ms)`;
            case 'suite:start':
              return `> ${name}`;
          }
        })();
        return (
          <Text
            style={{ ...styles.progress, ...styles[`progress.${event}`] }}
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
  'progress.suite:complete': {
    color: 'lightblue',
  },
  'progress.suite:start': {
    color: 'lightblue',
  },
});

export default TestRunnerScreen;
