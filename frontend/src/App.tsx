import SmallFileUploadForm from './components/SmallFileUploadForm';

function App() {
  return (
    <div className="container min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-primary mb-6">
          Upload your files here
        </h1>
        <SmallFileUploadForm />
      </div>
    </div>
  );
}

export default App;
