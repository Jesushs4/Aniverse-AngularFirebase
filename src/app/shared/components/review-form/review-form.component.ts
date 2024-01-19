import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { Review } from 'src/app/core/interfaces/review';
import { LibraryService } from 'src/app/core/services/library.service';
import { ReviewService } from 'src/app/core/services/review.service';

@Component({
  selector: 'app-review-form',
  templateUrl: './review-form.component.html',
  styleUrls: ['./review-form.component.scss'],
})
export class ReviewFormComponent implements OnInit {
  form: FormGroup;


  mode: 'New' | 'Edit' = 'New';
  @Input() set review(_review: Review | null) {
    if (_review) {
      this.mode = 'Edit'
      this.form.controls['summary'].setValue(_review.summary);
      this.form.controls['review'].setValue(_review.review);
    }
  }

  constructor(
    private formBuilder: FormBuilder,
    private newModal: ModalController,
    private libraryService: LibraryService,
    public reviewService: ReviewService
  ) {
    this.form = this.formBuilder.group({
      summary: ['', Validators.required],
      review: ['', Validators.required],
    })
  }
  ngOnInit() {
  }

  onSubmit() {
    this.newModal.dismiss(this.form.value, 'submit');
  }

  onCancel() {
    this.newModal.dismiss(null, 'cancel');
  }


}
