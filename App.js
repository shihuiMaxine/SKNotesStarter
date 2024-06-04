import React, { useState, useEffect } from 'react';
import { TouchableOpacity, View, FlatList, SafeAreaView, Text, ScrollView, TextInput } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import tw, { useDeviceContext } from 'twrnc';
import { Provider } from 'react-redux';
import { store } from './store';
import { useSearchNotesQuery, useAddNoteMutation, useUpdateNoteMutation, useDeleteNoteMutation } from './db';
import { Ionicons } from '@expo/vector-icons';

// notes content
const initialNotes = [
{ id: '1', title: 'State', content: 'Component State' },
{ id: '2', title: 'Custom', content: 'Components are a way of packaging and reusing code' },
{ id: '3', title: 'Image', content: 'The React Native Image Component' }
];

// HomeScreen 
function HomeScreen({ navigation }) {
  useDeviceContext(tw);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: notes, isLoading, error } = useSearchNotesQuery();
  const [filteredNotes, setFilteredNotes] = useState(initialNotes);
  const [addNote] = useAddNoteMutation();
  const [useUpdate] = useUpdateNoteMutation();
  const [deleteNote] = useDeleteNoteMutation();

  useEffect(() => {
    if (notes) {
      setFilteredNotes(notes);
    }
  }, [notes]);

  // search fuction
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredNotes(notes || initialNotes);
    } else {
      const filtered = (notes || initialNotes).filter(note =>
        note.title.toLowerCase().includes(query.toLowerCase()) ||
        note.content.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredNotes(filtered);
    }
  };

  // deletng note
  const handleDeleteNote = async (id) => {
    await deleteNote(id);
    setFilteredNotes(filteredNotes.filter(note => note.id !== id));
  };

  // adding new notes
  const handleAddNote = async (newNote) => {
    const { data } = await addNote(newNote);
    if (data) {
      // Add the new note at the beginning of the list
      setFilteredNotes([data, ...filteredNotes]);
    }
  };

  // updating a note
  const handleUpdateNote = (updatedNote) => {
    const updatedNotes = filteredNotes.map(note =>
      note.id === updatedNote.id ? updatedNote : note
    );
    setFilteredNotes(updatedNotes);
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-black`}>
      <Text style={tw`text-center text-xl text-white mt-16 mb-4`}>Notes</Text>
      <TextInput
        style={tw`m-4 p-2 bg-gray-800 text-white rounded`}
        placeholder="Search"
        placeholderTextColor="#888"
        value={searchQuery}
        onChangeText={handleSearch}
      />
      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={tw`w-1/2 p-4 m-1 bg-gray-800 rounded`}
            onPress={() => navigation.navigate('NoteDetail', { note: item, handleDeleteNote, handleUpdateNote })}
          >
            <Text style={tw`text-lg text-white`}>{item.title}</Text>
            <Text style={tw`text text-white`}>{item.content}</Text>
          </TouchableOpacity>
        )}
        numColumns={2}
      />
      <TouchableOpacity
        style={tw`absolute bottom-8 right-8 bg-blue-600 p-4 rounded-full`}
        onPress={() => navigation.navigate('NewNote', { handleAddNote })}
      >
        <Text style={tw`text-white text-lg`}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// Note Detail
function NoteDetailScreen({ route, navigation }) {
  useDeviceContext(tw);
  const { note, handleDeleteNote, handleUpdateNote } = route.params;
  const [currentNote, setCurrentNote] = useState(note);

  // updating note
  const handleContentChange = (text) => {
    const updatedNote = { ...currentNote, content: text };
    setCurrentNote(updatedNote);
    handleUpdateNote(updatedNote); // Update the note in the list
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-black p-4`}>
      <View style={tw`flex-row justify-between mb-4`}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={tw`text-lg text-white`}>&lt; Notes</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { handleDeleteNote(note.id); navigation.goBack(); }}>
          <Ionicons name="trash" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <ScrollView>
        <Text style={tw`text-xl text-white mb-4`}>{currentNote.title}</Text>
        <TextInput
          style={tw`bg-gray-800 text-white p-2 rounded text-lg`}
          value={currentNote.content}
          onChangeText={handleContentChange}
          multiline
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// New Note
function NewNoteScreen({ route, navigation }) {
  useDeviceContext(tw);
  const { handleAddNote } = route.params;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Add a note
  const addNewNote = () => {
    if (title.trim() && content.trim()) {
      const newNote = {
        id: String(Date.now()),
        title,
        content
      };
      handleAddNote(newNote);
      navigation.goBack();
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-black p-4`}>
      <TouchableOpacity
        style={tw`bg-black p-4 rounded`}
        onPress={addNewNote}
      >
        <Text style={tw`text-white text-lg text-left`}>&lt; Notes</Text>
      </TouchableOpacity>
      <TextInput
        style={tw`bg-black text-white p-2 mb-4 rounded text-lg`}
        placeholder="Title"
        placeholderTextColor="#888"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={tw`bg-black text-white p-2 mb-4 rounded text-lg`}
        placeholder="New note"
        placeholderTextColor="#888"
        value={content}
        onChangeText={setContent}
        multiline
      />
    </SafeAreaView>
  );
}

const Stack = createNativeStackNavigator();

function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="NoteDetail"
            component={NoteDetailScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="NewNote"
            component={NewNoteScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}

export default App;
