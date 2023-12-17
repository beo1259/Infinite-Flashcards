import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FormBuilder, FormsModule } from '@angular/forms';
import axios from 'axios';
import { environment } from '../environments/environment';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent implements OnInit {
  title = 'infiniteflashcards';
  isLoading = false;
  newDeckName: string = '';
  decks: Array<{ name: string, flashcards: Array<{ front: string; back: string, flipped: boolean }> }> = [];
  selectedDeckName: string = '';

  ngOnInit() {
    const storedFlashcards = localStorage.getItem('flashcards');
    if (storedFlashcards) {
      this.flashcards = JSON.parse(storedFlashcards);
    }
    this.loadDecksFromLocalStorage();
    // load the first deck by default 
    if (this.decks.length > 0) {
      this.flashcards = this.decks[0].flashcards;
      this.selectedDeckName = this.decks[0].name;
    }
  }

  loadDecksFromLocalStorage() {
    const storedDecks = localStorage.getItem('decks');
    if (storedDecks) {
      this.decks = JSON.parse(storedDecks);
    }
  }

  deleteSelectedDeck() {
    if (this.selectedDeckName) {
      const isConfirmed = confirm(`Are you sure you want to delete the deck "${this.selectedDeckName}"?`);
      if (isConfirmed) {
        this.decks = this.decks.filter(deck => deck.name !== this.selectedDeckName);
        localStorage.setItem('decks', JSON.stringify(this.decks));
        if (this.decks.length > 0) {
          // if there are still decks, set the selected deck to the first one
          this.selectedDeckName = this.decks[0].name;
          this.flashcards = this.decks[0].flashcards;
        } else {
          // if no decks are left, reset everything
          this.selectedDeckName = '';
          this.flashcards = [];
        }
      } else {
        alert('No deck selected for deletion.');
      }

    }
  }

  loadSelectedDeck() {
    const selectedDeck = this.decks.find(deck => deck.name === this.selectedDeckName);
    if (selectedDeck) {
      this.flashcards = selectedDeck.flashcards;
      this.currentIndex = 0;
      this.toggleFlashcard(false);
    }
  }

  toggleFlashcard(flashcard: any) {
    flashcard.flipped = !flashcard.flipped;
  }

  saveNewDeck(name: string) {
    if (name) {
      this.decks.push({ name: name, flashcards: this.flashcards });
      localStorage.setItem('decks', JSON.stringify(this.decks));
      this.newDeckName = '';
      console.log('New deck saved to localStorage');
    } else {
      console.log('Please enter a name for the deck.');
    }
  }

  apiKey = environment.apiKey;

  userAnswer = '';
  flashcards: Array<{ front: string; back: string, flipped: boolean }> = [];
  currentIndex = 0;

  nextFlashcard() {
    if (this.currentIndex < this.flashcards.length - 1) {
      this.currentIndex++;
      this.toggleFlashcard(false);
    }
  }

  prevFlashcard() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }


  submitAnswer = async () => {
    this.isLoading = true;
    this.flashcards = [];
    console.log("Topic:", this.userAnswer);

    const messages = [
      {
        role: "system", content: `You will generate AT LEAST 100 FLASHCARDS from the given user input, there can be 
        no repetition among the flashcards that you generate. * **IMPORTANT: THERE IS NO NEWLINE BETWEEN FRONT AND BACK! THE END OF FRONT IS ONLY SEPERATED FROM BACK BY A SPACE**
        IT MUST BE IN THE FOLLOWING FORMAT, STARTING AFTER THE COLON, WHITESPACES INCLUDED*:
        Front: YOURANSWERHERE Back: YOURANSWERHERE The front should be the question and the back should be the answer.`},

      { role: "user", content: `Here is the topic that the user would like to study, from which you will generate flashcards in the format specified: ${this.userAnswer}` }

    ];

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {

        model: 'gpt-4',
        messages: messages,
        temperature: 0.8,
        max_tokens: 8000,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
      }
    );

    if (response.data && response.data.choices) {
      const choices = response.data.choices;
      choices.forEach((choice: any) => {
        if (choice.message) {
          console.log(choice.message.content);
          // split the response into lines
          const lines = choice.message.content.split('\n');
          lines.forEach((line: string) => {
            // split the line by 'Back:' first, to separate the front and the back
            const parts = line.split('Back:');
            if (parts.length === 2) {
              const frontPart = parts[0].trim();
              const backPart = parts[1].trim();

              const front = frontPart.startsWith('Front:') ? frontPart.slice('Front:'.length).trim() : frontPart;
              const back = backPart;
              const flipped = false;
              // store the flashcard

              this.flashcards.push({ front, back, flipped });

            }
          });

          console.log(this.flashcards);
        }
      });


    } else {
      console.log('No data received from OpenAI');
    }
    this.isLoading = false;
    localStorage.setItem('flashcards', JSON.stringify(this.flashcards));

  }
}