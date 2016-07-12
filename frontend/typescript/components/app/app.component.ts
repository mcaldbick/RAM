import 'ng2-bootstrap';
import {Component} from '@angular/core';
import {HTTP_PROVIDERS} from '@angular/http';
import {ROUTER_DIRECTIVES} from '@angular/router';

import {RAMRestService} from '../../services/ram-rest.service';
import {RAMModelHelper} from '../../commons/ram-model-helper';
import {RAMRouteHelper} from '../../commons/ram-route-helper';
import {RAMNavService} from '../../services/ram-nav.service';
import {RAMConstantsService} from '../../services/ram-constants.service';

import {MyIdentityComponent} from '../commons/my-identity/my-identity.component';
import {ErrorComponent} from '../commons/error/error.component';
import {ErrorService} from '../commons/error/error.service';

@Component({
    selector: 'ram-app',
    templateUrl: 'app.component.html',
    directives: [ROUTER_DIRECTIVES, ErrorComponent, MyIdentityComponent],
    providers: [
        HTTP_PROVIDERS,
        RAMRestService,
        RAMModelHelper,
        RAMRouteHelper,
        RAMNavService,
        RAMConstantsService,
        ErrorService
    ]
})

export class AppComponent {
}