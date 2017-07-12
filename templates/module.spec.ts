import { TestBed, async } from '@angular/core/testing'
import { {{moduleClass}} } from '../{{{moduleFilename}}}'

describe('{{moduleClass}}', () => {
    
    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [],
            imports: [
                {{moduleClass}}
            ]
        })
    })

    it('should log module {{moduleClass}}', () => {
        console.log({{moduleClass}})
        expect({{moduleClass}}).toBeTruthy()
    })
})
