import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { Anime } from 'src/app/core/interfaces/anime';

@Component({
  selector: 'app-anime-form',
  templateUrl: './anime-form.component.html',
  styleUrls: ['./anime-form.component.scss'],
})
export class AnimeFormComponent implements OnInit {

  public animeInfo!: Anime | null;

  form: FormGroup;
  mode: 'New' | 'Edit' = 'New';
  @Input() set anime(_anime: Anime | null) {
    this.animeInfo = _anime;
    if (_anime?.watch_status) {
      this.mode = 'Edit'
      this.form.controls['user_score'].setValue(_anime.user_score);
      this.form.controls['watch_status'].setValue(_anime.watch_status);
      this.form.controls['episodes_watched'].setValue(_anime.episodes_watched);
    }
  }

  constructor(
    private newModal: ModalController,
    private formBuilder: FormBuilder
  ) {
    this.form = this.formBuilder.group({
      user_score: ['', Validators.required],
      watch_status: ['', Validators.required],
      episodes_watched: [1],
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
