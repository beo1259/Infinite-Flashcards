import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FormBuilder, FormsModule } from '@angular/forms';
import axios from 'axios';
import { environment } from '../environments/environment';
declare var webkitSpeechRecognition: any;



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent implements OnInit {
  speechRecognition: any;
  title = 'infiniteflashcards';
  isLoading = false;
  newDeckName: string = '';
  decks: Array<{ name: string, flashcards: Array<{ front: string; back: string, flipped: boolean }> }> = [];
  selectedDeckName: string = '';
  editingCardIndex: number | null = null;
  isEditCurrentCard: boolean = false;
  isRecording = false;

  showSaveModal = false;
  showLoadModal = false;
  modalVisible = false;

  studyMode = false;

  toggleStudy(){
    this.studyMode = !this.studyMode;
  
  }



  toggleSaveModal() {
    this.showSaveModal = !this.showSaveModal;
    if (!this.selectedDeckName) {
      this.showSaveModal = true;
    }
    if (this.showLoadModal) {
      this.showLoadModal = false;
    }
    this.isModalOpen = this.showSaveModal || this.showLoadModal;
  }

  toggleLoadModal() {
    this.showLoadModal = !this.showLoadModal;
    if (this.showSaveModal) {
      this.showSaveModal = false;
    }
    this.isModalOpen = this.showSaveModal || this.showLoadModal;
  }

  openModal(type: 'save' | 'load') {
    if (type === 'save') {
      this.showSaveModal = true;
    } else if (type === 'load') {
      this.showLoadModal = true;
    }
    setTimeout(() => {
      this.isModalOpen = true;
    }, 0);
  }

  exitStudyMode(event: Event): void {
    event.stopPropagation(); 
    this.toggleStudy();
  }

  closeModal() {
    this.isModalOpen = false;

    setTimeout(() => {
      this.showSaveModal = false;
      this.showLoadModal = false;
    }, 100);
  }

  ngOnInit() {
    const storedFlashcards = localStorage.getItem('flashcards');
    if (storedFlashcards) {
      this.flashcards = JSON.parse(storedFlashcards);
    }
    this.decks.unshift({ name: 'Unsaved Deck', flashcards: [] });

    this.loadDecksFromLocalStorage();
    // load the first deck by default 
    if (this.decks.length > 0) {
      this.flashcards = this.decks[0].flashcards;
      this.selectedDeckName = this.decks[0].name;
    }

    if ('webkitSpeechRecognition' in window) {
      this.speechRecognition = new webkitSpeechRecognition();
      this.speechRecognition.continuous = false;
      this.speechRecognition.interimResults = false;
      this.speechRecognition.lang = 'en-US';
      this.speechRecognition.onresult = (event: any) => {
        this.userAnswer = event.results[0][0].transcript;
      };
    }
  }

  toggleSpeechRecognition() {
    if (this.speechRecognition) {
      if (!this.isRecording) {
        this.speechRecognition.start();
        this.isRecording = true; 
      } else {
        this.speechRecognition.stop();
        this.isRecording = false; 
      }
    } else {
      console.error('Speech recognition not supported in this browser.');
    }
  }

  isModalOpen: boolean = false;

  startEditing(index: number): void {
    this.editingCardIndex = index;
  }

  editCurrentCard(): void {
    this.isEditCurrentCard = true;
  }

  saveCurrentCardEdit(): void {
    localStorage.setItem('flashcards', JSON.stringify(this.flashcards));
    this.isEditCurrentCard = false;
  }

  cancelCurrentCardEdit(): void {
    this.isEditCurrentCard = false;
  }


  saveChanges(): void {
    localStorage.setItem('flashcards', JSON.stringify(this.flashcards));
    this.editingCardIndex = null;
  }

  cancelEditing(): void {
    this.editingCardIndex = null;
  }

  toggleModal() {
    this.isModalOpen = !this.isModalOpen;
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
    if (this.selectedDeckName === 'Unsaved Deck') {
      this.flashcards = [];
      this.currentIndex = 0;
    }
    if (selectedDeck) {
      this.flashcards = selectedDeck.flashcards;
      this.currentIndex = 0;
      this.flashcards[this.currentIndex].flipped = false;
    }
  }

  deleteCurrentCard(): void {
    const isConfirmed = confirm(`Are you sure you want to delete this card?`);
    if(isConfirmed){
      if (this.flashcards && this.flashcards.length > 0 && this.currentIndex != null) {

        this.flashcards.splice(this.currentIndex, 1);
  
        if (this.currentIndex >= this.flashcards.length) {
          this.currentIndex = this.flashcards.length - 1;
        } 

        localStorage.setItem('flashcards', JSON.stringify(this.flashcards));
      }
    }
    
  }

  toggleFlashcard(flashcard: any) {
    flashcard.flipped = !flashcard.flipped;
  }

  saveNewDeck(name?: string) {
    if (name) {
      const existingDeckIndex = this.decks.findIndex(deck => deck.name === name);
  
      if (existingDeckIndex !== -1) {
        this.decks[existingDeckIndex].flashcards = this.flashcards;
        alert('Deck updated successfully.');
      } else {
        this.decks.push({ name: name, flashcards: this.flashcards });
        this.selectedDeckName = name; 
        alert('New deck saved successfully.');
      }
  
      localStorage.setItem('decks', JSON.stringify(this.decks));
      this.newDeckName = ''; 
      this.closeModal(); 
    } else {
      this.toggleSaveModal();
    }
  }
  
  

  apiKey = environment.apiKey;

  userAnswer = '';
  selectedCardQuantity = 10;
  cardQuantities = [10, 25, 50, 100, 250, 500];
  flashcards: Array<{ front: string; back: string, flipped: boolean }> = [];
  currentIndex = 0;

  nextFlashcard() {
    if (this.currentIndex < this.flashcards.length - 1) {
      this.currentIndex++;
      this.flashcards[this.currentIndex].flipped = false;
    }
  }

  prevFlashcard() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.flashcards[this.currentIndex].flipped = false;
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') {
      this.nextFlashcard();
    } else if (event.key === 'ArrowLeft') {
      this.prevFlashcard();
    }
    if (event.key === 'Enter') {
      this.flashcards[this.currentIndex].flipped = !this.flashcards[this.currentIndex].flipped;


    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file: File = input.files[0];

      console.log('Uploaded file:', file.name);
    }
  }


  submitAnswer = async () => {
    this.isLoading = true;
    this.flashcards = [];
    console.log("Topic:", this.userAnswer);

    const messages = [
      {
        role: "system", content: `You will generate AT LEAST ${this.selectedCardQuantity} FLASHCARDS from the given user input, there can be 
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
    this.selectedDeckName = 'Unsaved Deck';

  }
}
