import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-nickname-form',
  templateUrl: './nickname-form.component.html',
  styleUrls: ['./nickname-form.component.scss'],
})
export class NicknameFormComponent implements OnInit {

  form: FormGroup;

  constructor(
    private newModal: ModalController,
    private formBuilder: FormBuilder
  ) {
    this.form = this.formBuilder.group({
      nickname: ['', Validators.required],
    })
  }

  ngOnInit() {
  }

  onCancel() {
    this.newModal.dismiss(null, 'cancel');
  }

  onSubmit() {
    this.newModal.dismiss(this.form.value, 'submit');
  }

}
