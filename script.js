document.addEventListener("DOMContentLoaded", () => {
    // Get the canvas element from the DOM
    const canvas = document.getElementById("gameCanvas"); // Reference to the canvas for drawing
    const ctx = canvas.getContext("2d"); // 2D rendering context for the canvas
    canvas.width = 400; // Set the width of the canvas
    canvas.height = 400; // Set the height of the canvas

    // Game State Management
    let gameState = "paused"; // Initialize game state as paused
    const setState = (newState) => {
        gameState = newState; // Update game state to new value
    };

    // Boolean function to check if the game is currently playing
    const isPlaying = () => gameState === "playing"; // Return true if game state is 'playing'
    // Boolean function to check if the game is over
    const isGameOver = () => gameState === "game over"; // Return true if game state indicates game over

    // Pac-Man Properties
    const PacMan = {
        x: canvas.width / 2, // Initial horizontal position in the center
        y: canvas.height / 2, // Initial vertical position in the center
        size: 10, // Size of Pac-Man in pixels
        color: "yellow", // Color of Pac-Man
        speed: 2, // Speed at which Pac-Man moves

        // Method to draw Pac-Man on the canvas
        draw: () => {
            ctx.beginPath(); // Begin a new path for drawing
            ctx.arc(PacMan.x, PacMan.y, PacMan.size, 0.2 * Math.PI, 1.8 * Math.PI); // Draw Pac-Man as an arc
            ctx.lineTo(PacMan.x, PacMan.y); // Create a line back to the center to close the shape
            ctx.fillStyle = PacMan.color; // Set fill color to Pac-Man's color
            ctx.fill(); // Fill the shape with the specified color
            ctx.closePath(); // Close the path for future drawing
        },

        // Move Pac-Man towards a target position
        moveTo: (targetX, targetY) => {
            const deltaX = targetX - PacMan.x; // Calculate difference in x direction
            const deltaY = targetY - PacMan.y; // Calculate difference in y direction
            const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2); // Calculate the distance to the target

            // Only move if there's distance to cover
            if (distance > 0) {
                const directionX = (deltaX / distance) * PacMan.speed; // Calculate x movement
                const directionY = (deltaY / distance) * PacMan.speed; // Calculate y movement

                const nextX = PacMan.x + directionX; // Next x position after movement
                const nextY = PacMan.y + directionY; // Next y position after movement

                // Check for wall collision and update x only if it's safe
                if (!checkWallCollision(nextX, PacMan.y)) {
                    PacMan.x = nextX; // Update Pac-Man's x position
                }
                // Check for wall collision and update y only if it's safe
                if (!checkWallCollision(PacMan.x, nextY)) {
                    PacMan.y = nextY; // Update Pac-Man's y position
                }
            }
        }
    };

    // Ghost Properties
    const Ghost = {
        size: 10, // Size of the ghost
        color: "red", // Color of the ghost
        speed: 1, // Speed at which the ghost moves
        x: 0, // Initial horizontal position
        y: 0, // Initial vertical position
        startX: 0, // Starting x position of the ghost
        startY: 0, // Starting y position of the ghost
        mode: "nest", // Current mode of the ghost (nest, hunt, flee)
        stuckCounter: 0, // Count how many frames the ghost has been stuck
        stuckThreshold: 10, // Threshold to decide if the ghost should change direction

        // Method to draw the ghost on the canvas
        draw: function () {
            ctx.beginPath(); // Begin a new path for drawing
            ctx.arc(this.x, this.y, this.size, 0.2 * Math.PI, 1.8 * Math.PI); // Draw ghost circular shape
            ctx.lineTo(this.x, this.y); // Create line back to center
            ctx.fillStyle = this.color; // Set fill color to the ghost's color
            ctx.fill(); // Fill the ghost shape
            ctx.closePath(); // Close the drawing path
        },

        // Move the ghost based on the current mode
        move: function () {
            const deltaX = PacMan.x - this.x; // Difference in x between ghost and Pac-Man
            const deltaY = PacMan.y - this.y; // Difference in y between ghost and Pac-Man
            const distanceToPacMan = Math.sqrt(deltaX ** 2 + deltaY ** 2); // Calculate distance to Pac-Man
            let moved = false; // Track if the ghost was able to move

            // Set ghost's mode based on distance to Pac-Man
            if (distanceToPacMan < 100) {
                this.mode = "hunt"; // Enter hunt mode if within 100 pixels
            } else if (distanceToPacMan > 150) {
                this.mode = "flee"; // Enter flee mode if more than 150 pixels away
            } else {
                this.mode = "nest"; // Otherwise, stay in nest mode
            }

            let targetX = this.x; // Hold the target x position for ghost movement
            let targetY = this.y; // Hold the target y position for ghost movement

            // In hunt mode, move closer to Pac-Man
            if (this.mode === "hunt") {
                if (distanceToPacMan > 0) { // Avoid division by zero
                    targetX = this.x + (deltaX / distanceToPacMan) * this.speed; // Calculate target x
                    targetY = this.y + (deltaY / distanceToPacMan) * this.speed; // Calculate target y
                }
            } 
            // In flee mode, move away from Pac-Man
            else if (this.mode === "flee") {
                if (distanceToPacMan > 0) { // Avoid division by zero
                    targetX = this.x - (deltaX / distanceToPacMan) * this.speed; // Calculate target x
                    targetY = this.y - (deltaY / distanceToPacMan) * this.speed; // Calculate target y
                }
            } 
            // In nest mode, return to starting position
            else if (this.mode === "nest") {
                const deltaStartX = this.startX - this.x; // Difference to starting x position
                const deltaStartY = this.startY - this.y; // Difference to starting y position
                const startDistance = Math.sqrt(deltaStartX ** 2 + deltaStartY ** 2); // Distance to starting position

                if (startDistance > 0) { // Avoid division by zero
                    targetX = this.x + (deltaStartX / startDistance) * this.speed; // Move towards starting x
                    targetY = this.y + (deltaStartY / startDistance) * this.speed; // Move towards starting y
                }
            }

            // Check wall collision for x movement
            if (!checkWallCollision(targetX, this.y)) {
                this.x = targetX; // Update ghost's x position
                moved = true; // Mark as moved if successful
            }
            // Check wall collision for y movement
            if (!checkWallCollision(this.x, targetY)) {
                this.y = targetY; // Update ghost's y position
                moved = true; // Mark as moved if successful
            }

            // If ghost didn't move
            if (!moved) {
                this.stuckCounter++; // Increment stuck counter
                // Change direction if stuck for too long
                if (this.stuckCounter >= this.stuckThreshold) {
                    this.changeDirectionRandomly(); // Change ghost's direction randomly
                    this.stuckCounter = 0; // Reset stuck counter
                }
            } else {
                this.stuckCounter = 0; // Reset stuck counter if moved successfully
            }
        },

        // Function to change ghost's direction randomly
        changeDirectionRandomly: function () {
            const randomDirection = Math.floor(Math.random() * 4); // Randomly select a direction (0-3)
            switch (randomDirection) {
                case 0: this.y -= this.speed; break; // Move up
                case 1: this.y += this.speed; break; // Move down
                case 2: this.x -= this.speed; break; // Move left
                case 3: this.x += this.speed; break; // Move right
            }

            // Check for wall collision after changing direction
            if (checkWallCollision(this.x, this.y)) {
                // Reverse the movement based on direction if collision detected
                this.x -= (randomDirection === 2 ? this.speed : (randomDirection === 3 ? -this.speed : 0));
                this.y -= (randomDirection === 0 ? this.speed : (randomDirection === 1 ? -this.speed : 0));
            }
        },

        // Method to set the starting position of the ghost
        setStartPosition: function () {
            this.startX = this.x; // Store current x as starting x
            this.startY = this.y; // Store current y as starting y
        }
    };

    // Array to hold pellet positions in the game
    const pellets = []; // Create an empty array for pellets
    const pelletSize = 5; // Define size of each pellet

    // Draw all pellets on the canvas
    const drawPellets = () => {
        ctx.fillStyle = "white"; // Set color for the pellets
        pellets.forEach((pellet) => { // Loop through each pellet in the array
            ctx.beginPath(); // Begin a new path for each pellet
            ctx.arc(pellet.x, pellet.y, pelletSize, 0, Math.PI * 2); // Draw circular pellets
            ctx.fill(); // Fill the pellet shape with color
            ctx.closePath(); // Close the path for pellets
        });
    };

    // Function to remove a pellet from the array
    const clearPellet = (index) => {
        pellets.splice(index, 1); // Remove the pellet at the specified index
    };

    // Maze Layout configuration
    const mazeSize = 20; // Define the size of the maze
    const maze = []; // Create an empty array for the maze layout

    // Generate the maze layout using a randomized algorithm
    const generateMaze = () => {
        for (let i = 0; i < mazeSize; i++) {
            maze[i] = []; // Initialize each row of the maze as an empty array
            for (let j = 0; j < mazeSize; j++) {
                maze[i][j] = 1; // Fill the maze with walls (1 represents a wall)
            }
        }

        const stack = []; // Stack to help in the maze generation
        const startRow = 1; // Starting row for maze generation
        const startCol = 1; // Starting column for maze generation
        maze[startRow][startCol] = 0; // Mark start position as free (0)

        stack.push({ row: startRow, col: startCol }); // Push the starting position to stack

        // While there are positions left in the stack
        while (stack.length > 0) {
            const current = stack.pop(); // Get and remove last position from stack
            const row = current.row; // Current row
            const col = current.col; // Current column

            const neighbors = []; // Array to hold valid neighboring positions
            const directions = [
                { row: -2, col: 0 }, // Up
                { row: 2, col: 0 }, // Down
                { row: 0, col: -2 }, // Left
                { row: 0, col: 2 } // Right
            ];

            // Loop through each direction to find valid neighbors
            for (const dir of directions) {
                const newRow = row + dir.row; // Calculate new row based on direction
                const newCol = col + dir.col; // Calculate new column based on direction

                // Check if the new position is inside maze bounds and is a wall
                if (newRow > 0 && newRow < mazeSize - 1 && newCol > 0 && newCol < mazeSize - 1 && maze[newRow][newCol] === 1) {
                    neighbors.push({ row: newRow, col: newCol }); // Add valid neighbor to neighbors array
                }
            }

            // If there are valid neighbors
            if (neighbors.length > 0) {
                stack.push(current); // Push current position back onto the stack
                const next = neighbors[Math.floor(Math.random() * neighbors.length)]; // Choose a random neighbor
                const wallRow = row + (next.row - row) / 2; // Find wall to knock down
                const wallCol = col + (next.col - col) / 2; // Find wall to knock down

                // Knock down the wall between current and chosen neighbor
                maze[wallRow][wallCol] = 0; // Mark as free (0)
                maze[next.row][next.col] = 0; // Mark neighbor as free (0)

                stack.push(next); // Push the chosen neighbor onto the stack
            }
        }

        // Randomly clear some areas in the maze to allow for more open pathways
        for (let i = 1; i < mazeSize - 1; i++) {
            for (let j = 1; j < mazeSize - 1; j++) {
                if (Math.random() < 0.15) { // 15% chance to remove a wall
                    maze[i][j] = 0; // Mark as free space
                }
            }
        }
    };

    // Draw the maze on the canvas
    const drawMaze = () => {
        ctx.strokeStyle = "blue"; // Set stroke color for maze walls
        ctx.lineWidth = 1; // Set line width for walls

        const cellSize = canvas.width / mazeSize; // Calculate size of each cell

        // Loop through the maze array to draw walls
        for (let row = 0; row < maze.length; row++) {
            for (let col = 0; col < maze[row].length; col++) {
                // If the current cell is a wall
                if (maze[row][col] === 1) {
                    ctx.fillStyle = "darkblue"; // Set color for walls
                    ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize); // Draw a wall
                }
            }
        }
    };

    // Check if the next position collides with a wall
    const checkWallCollision = (nextX, nextY) => {
        const cellSize = canvas.width / maze.length; // Calculate the size of each cell
        const row = Math.floor(nextY / cellSize); // Determine the cell's row
        const col = Math.floor(nextX / cellSize); // Determine the cell's column
        return maze[row] && maze[row][col] === 1; // Return true if it's a wall
    };

    // Add pellets to empty spaces in the maze
    const addPelletsAlongPath = () => {
        const cellSize = canvas.width / mazeSize; // Calculate size of each cell

        // Loop through the maze to find open spaces
        for (let row = 1; row < mazeSize - 1; row++) {
            for (let col = 1; col < mazeSize - 1; col++) {
                if (maze[row][col] === 0) { // If it's an empty space
                    // Add a pellet at the center of the cell
                    pellets.push({
                        x: col * cellSize + cellSize / 2, // Center x position
                        y: row * cellSize + cellSize / 2 // Center y position
                    });
                }
            }
        }
    };

    // Check if Pac-Man collides with any pellets
    const checkPelletCollision = () => {
        for (let i = 0; i < pellets.length; i++) { // Loop through all pellets
            const pellet = pellets[i]; // Get current pellet
            const distance = Math.sqrt((PacMan.x - pellet.x) ** 2 + (PacMan.y - pellet.y) ** 2); // Calculate distance to pellet

            // If Pac-Man collides with the pellet
            if (distance < PacMan.size + pelletSize) {
                return i; // Return index of the collided pellet
            }
        }
        return -1; // Return -1 if no collision was detected
    };

    // Variables for continuous movement
    let targetX = PacMan.x; // Target x position
    let targetY = PacMan.y; // Target y position
    let isTouching = false; // Indicates if a touch is actively happening
    let keysPressed = {}; // Object to track pressed keys

    // Add event listeners to track key presses
    document.addEventListener("keydown", (event) => {
        keysPressed[event.key] = true; // Mark the key as pressed
    });

    document.addEventListener("keyup", (event) => {
        keysPressed[event.key] = false; // Mark the key as released
    });

    // Enhanced Touch Controls
    canvas.addEventListener("touchstart", (event) => {
        event.preventDefault(); // Prevent default touch behavior
        isTouching = true; // Set touching state to true
        // Update target position based on touch coordinates
        targetX = event.touches[0].clientX - canvas.offsetLeft; 
        targetY = event.touches[0].clientY - canvas.offsetTop; 
    });

    canvas.addEventListener("touchmove", (event) => {
        event.preventDefault(); // Prevent default touch behavior
        if (isTouching) { // If currently touching
            // Update target position based on touch coordinates
            targetX = event.touches[0].clientX - canvas.offsetLeft;
            targetY = event.touches[0].clientY - canvas.offsetTop;
        }
    });

    canvas.addEventListener("touchend", () => {
        isTouching = false; // Reset touching state when touch ends
    });

    // Method to place the ghost in the maze at a valid position
    const placeGhost = () => {
        const cellSize = canvas.width / mazeSize; // Calculate cell size
        let x, y; // Variables for ghost's position

        // Try to find a valid position for the ghost
        do {
            x = Math.floor(Math.random() * (mazeSize - 2)) + 1; // Random x position
            y = Math.floor(Math.random() * (mazeSize - 2)) + 1; // Random y position
        } while (maze[y][x] !== 0 || isPelletNearby(x, y)); // Ensure the position is free and not near pellets

        // Set ghost's position to the valid coordinates
        Ghost.x = x * cellSize + cellSize / 2; // Center the ghost in the cell
        Ghost.y = y * cellSize + cellSize / 2; // Center the ghost in the cell
        Ghost.setStartPosition(); // Initialize ghost's starting position
    };

    // Check if there are any pellets near the ghost's position
    const isPelletNearby = (row, col) => {
        const cellSize = canvas.width / mazeSize; // Calculate cell size
        const ghostX = col * cellSize + cellSize / 2; // Ghost's x position
        const ghostY = row * cellSize + cellSize / 2; // Ghost's y position

        // Loop through pellets to determine if any are near the ghost
        for (const pellet of pellets) {
            const distance = Math.sqrt((ghostX - pellet.x) ** 2 + (ghostY - pellet.y) ** 2); // Distance to the pellet
            if (distance < Ghost.size + pelletSize + 5) { // If the pellet is within range
                return true; // Return true if there is a nearby pellet
            }
        }
        return false; // Return false if no nearby pellets detected
    };

    // Function to restart the game
    const restartGame = () => {
        setState("playing"); // Change game state to playing
        const gameOverModal = document.getElementById("gameOverModal"); // Get game over modal
        gameOverModal.classList.add("hidden"); // Hide game over modal

        const restartButton = document.getElementById("restartButton"); // Get restart button
        // Set up click and touch events for restarting the game
        restartButton.addEventListener("click", restartGame); 
        restartButton.addEventListener("touchstart", restartGame); 

        resetGame(); // Reset game variables and state
    };

    // Main Game Loop
    const gameLoop = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas for redrawing
        drawMaze(); // Draw the maze on the canvas

        // Handle keyboard inputs for controlling Pac-Man
        if (isPlaying()) {
            // Update target position based on keyboard input
            if (keysPressed["ArrowUp"] || keysPressed["w"]) targetY -= PacMan.speed; // Move up
            if (keysPressed["ArrowDown"] || keysPressed["s"]) targetY += PacMan.speed; // Move down
            if (keysPressed["ArrowLeft"] || keysPressed["a"]) targetX -= PacMan.speed; // Move left
            if (keysPressed["ArrowRight"] || keysPressed["d"]) targetX += PacMan.speed; // Move right

            // Update target position based on touch events
            if (isTouching) {
                // Limit target position to the canvas boundaries
                targetX = Math.max(PacMan.size, Math.min(canvas.width - PacMan.size, targetX));
                targetY = Math.max(PacMan.size, Math.min(canvas.height - PacMan.size, targetY));
            }

            // Ensure target position does not exceed canvas boundaries
            targetX = Math.max(PacMan.size, Math.min(canvas.width - PacMan.size, targetX));
            targetY = Math.max(PacMan.size, Math.min(canvas.height - PacMan.size, targetY));

            // Move Pac-Man to the target position
            PacMan.moveTo(targetX, targetY); 
            PacMan.draw(); // Draw Pac-Man on the canvas

            Ghost.move(); // Move the ghost according to its logic
            Ghost.draw(); // Draw the ghost on the canvas

            drawPellets(); // Draw all pellets on the canvas

            // Check if Pac-Man collides with any pellet
            const pelletIndex = checkPelletCollision();
            if (pelletIndex >= 0) { // If a pellet was collected
                clearPellet(pelletIndex); // Remove pellet from the array
            }

            // Check collision between Pac-Man and the ghost
            const distanceToPacMan = Math.sqrt((Ghost.x - PacMan.x) ** 2 + (Ghost.y - PacMan.y) ** 2);
            if (distanceToPacMan < Ghost.size + PacMan.size) { // If they collide
                setState("game over"); // Update the game state to game over
            }
        } else if (isGameOver()) { // If game is over
            const gameOverModal = document.getElementById("gameOverModal"); // Get the game over modal
            gameOverModal.classList.remove("hidden"); // Display the game over modal
        }

        requestAnimationFrame(gameLoop); // Request the next frame for the game loop
    };

    // Function to reset the game state and positions
    const resetGame = () => {
        PacMan.x = canvas.width / 2; // Reset Pac-Man's x position to center
        PacMan.y = canvas.height / 2; // Reset Pac-Man's y position to center

        placeGhost(); // Place the ghost in a valid position

        pellets.length = 0; // Clear the existing pellets
        addPelletsAlongPath(); // Add new pellets based on maze layout
    };

    // Generate the initial maze layout and add pellets
    generateMaze(); // Create the maze
    addPelletsAlongPath(); // Populate pellets along the maze paths
    placeGhost(); // Initial placement of the ghost
    setState("playing"); // Set the initial game state to playing
    gameLoop(); // Start the main game loop
});