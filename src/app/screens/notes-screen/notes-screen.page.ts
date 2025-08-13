import { CommonModule, NgStyle } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActionSheetButton, ActionSheetController, InfiniteScrollCustomEvent, IonContent, IonicModule, ModalController, RefresherCustomEvent } from '@ionic/angular';
import { Actions } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { firstValueFrom, Observable } from 'rxjs';
import { SimpleCalendarComponent } from 'src/app/shared/components/simple-calendar/simple-calendar.component';
import { WriteNoteDialogComponent } from 'src/app/shared/components/write-note-dialog/write-note-dialog.component';
import { canDismissDialog } from 'src/app/shared/helpers';
import { QueryFilter } from 'src/app/shared/models';
import { EntryFormService } from 'src/app/shared/services/entry-form.service';
import { SupabaseService } from 'src/app/shared/services/supabase.service';
import { AppActions } from 'src/app/shared/state/actions/app.actions';
import { GlobalState } from 'src/app/shared/state/reducers/app.reducer';
import { selectListNotes } from 'src/app/shared/state/selectors/app.selectors';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-notes-screen',
  templateUrl: './notes-screen.page.html',
  styleUrls: ['./notes-screen.page.scss'],
  imports: [
    CommonModule,
    IonicModule,
    SimpleCalendarComponent,
    NgStyle,
  ]
})
export class NotesScreenPage implements OnInit {

  @ViewChild(IonContent) ionContent!: IonContent;

  infiniteEvent: InfiniteScrollCustomEvent | null = null;
  refreshEvent: RefresherCustomEvent | null = null;

  private filter: QueryFilter = {
    user_id: '',
    from_page: 0,
    to_page: environment.queryPerPage,
    lt_date: '',
    gt_date: '',
  };

  weekRangeLabel: string = '';
  ltDate: string = '';
  gtDate: string = '';
  notes$: Observable<{ data: any, isLoading: boolean }>;

  constructor(
    private supabaseService: SupabaseService,
    private entryFormService: EntryFormService,
    private store: Store<GlobalState>,
    private actionSheetCtrl: ActionSheetController,
    private modalCtrl: ModalController,
    private actions$: Actions,
  ) { 
    this.notes$ = this.store.pipe(select(selectListNotes));

    this.actions$.pipe(takeUntilDestroyed()).subscribe((action: any) => {
      switch (action.type) {
        case AppActions.getNotesSuccess.type:
          if (this.infiniteEvent) {
            this.infiniteEvent.target.complete();
            this.infiniteEvent = null;
          }

          if (this.refreshEvent) {
            this.refreshEvent.target.complete();
            this.refreshEvent = null;
          }

          break;

        case AppActions.createNoteSuccess.type:
          const source = action.source;
          if (source !== 'home') {
            if (this.ionContent) {
              this.ionContent.scrollToTop(250);
            }
          }
          break;
      }
    });
  }

  async openOptions(item: any) {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Actions',
      buttons: [
        {
          text: 'Edit',
          icon: 'pencil',
          handler: () => {
            this.editNote(item);
          }
        },
        {
          text: 'Delete',
          icon: 'trash',
          role: 'destructive',
          handler: () => {
            this.store.dispatch(AppActions.deleteNote({ id: item.id }));
          },
        },
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel',
        },
      ],
    });

    await actionSheet.present();
  }

  ngOnInit() {
  }

  /**
   * Get the week range label
   */
  getWeekRangeLabel(label: string) {
    this.weekRangeLabel = label;
    this.filter = {
      ...this.filter,
      from_page: 0,
      to_page: environment.queryPerPage,
    }
  }

  /**
   * Get calendar result
   */
  async getWeekDataResult(data: string) {
    const session = await this.supabaseService.session();
    if (!session) {
      console.error('No session found');
      return;
    }

    const toJson = JSON.parse(data);
    this.ltDate = toJson.formatted[0];
    this.gtDate = toJson.formatted[toJson.formatted.length - 1];

    this.filter = {
      ...this.filter,
      user_id: session.user.id,
      lt_date: this.ltDate,
      gt_date: this.gtDate,
      from_page: 0,
      to_page: environment.queryPerPage,
    }

    this.store.dispatch(AppActions.getNotes({ filter: this.filter }));
  }

  /**
   * Edit handler
   */
  async editNote(item: any) {
    const modal = await this.modalCtrl.create({
      component: WriteNoteDialogComponent,
      backdropDismiss: false,
      componentProps: {
        data: item
      }
    });

    await modal.present();
  }
  
  /**
   * Add note dialog
   */
  async onAddNote() {
    const modal = await this.modalCtrl.create({
      component: WriteNoteDialogComponent,
      backdropDismiss: true,
      canDismiss: async (data?: any, role?: string) => {
        const { content, recordedData, uploadedRecordedData } = await firstValueFrom(this.entryFormService.state$);
        if ((content && content.trim() !== '') || recordedData || uploadedRecordedData) {
          const canDismiss = await canDismissDialog();
          if (canDismiss) {
            this.entryFormService.resetState();
            return true;
          }
        }

        return true;
      },
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data) {
      console.log('Modal data:', data);
    }
  }

  /**
   * Load more enrolled lessons when the user scrolls down.
   */
  onIonInfinite(event: InfiniteScrollCustomEvent) {
    this.infiniteEvent = event;
    this.filter = {
      ...this.filter,
      from_page: this.filter.from_page + environment.queryPerPage,
      to_page: this.filter.to_page + environment.queryPerPage,
    }

    this.store.dispatch(AppActions.getNotes({
      filter: this.filter,
      metadata: {
        isLoadMore: true,
      }
    }));
  }

  /**
   * Handle pull to refresh
   */
  handleRefresh(event: RefresherCustomEvent) {
    this.refreshEvent = event;
    this.filter = {
      ...this.filter,
      from_page: 0,
      to_page: environment.queryPerPage,
    }

    this.store.dispatch(AppActions.getNotes({
      filter: this.filter,
      metadata: {
        isLoadMore: true,
      }
    }));
  }

}

