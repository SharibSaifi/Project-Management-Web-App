test('Creating a project with tasks should save the data correctly', async () => {
    const sampleProjects = [
        { name: 'Project A', tasks: ['Task 1', 'Task 2', 'Task 3'] },
        { name: 'Project B', tasks: ['Task 4', 'Task 5'] },
        // Add more sample projects and tasks as needed
    ];

    // Make API call to save the data to the backend
    const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(sampleProjects),
    });

    // Handle the response and retrieve saved data if successful
    if (response.ok) {
        const savedData = await response.json();

        // Perform assertions to verify the correctness of the saved data
        expect(savedData).toEqual(sampleProjects);
    } else {
        // Handle error scenarios
        console.error('Failed to save data to backend');
    }
});
